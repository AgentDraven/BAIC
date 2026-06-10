#[cfg(target_os = "macos")]
mod app_nap;
mod analytics;
mod commands;
mod config;
mod local_http_api;
mod log_path;
mod panel;
mod plugin_engine;
mod probe_batch;
mod shortcuts;
mod tray;
#[cfg(target_os = "macos")]
mod webkit_config;

use std::path::PathBuf;
use std::sync::Mutex;

use tauri_plugin_log::{Target, TargetKind};

use analytics::{spawn_daily_active_rollover_tracker, track_daily_active_if_needed};
use commands::{
    get_log_path, hide_panel, init_panel, list_plugins, open_devtools, set_panel_keep_on_taskbar,
    set_panel_pinned, set_panel_stay_open_when_pinned,
};
use probe_batch::start_probe_batch;
#[cfg(desktop)]
use shortcuts::{register_initial_shortcut, update_global_shortcut};

pub struct AppState {
    pub plugins: Vec<plugin_engine::manifest::LoadedPlugin>,
    pub app_data_dir: PathBuf,
    pub app_version: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let runtime = tokio::runtime::Runtime::new().expect("Failed to create Tokio runtime");
    let _guard = runtime.enter();

    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default();
    // Native NSPanel dropdown plugin — macOS only. Windows/Linux use the main
    // WebviewWindow as the dropdown (see src/panel/other.rs).
    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_nspanel::init());
    }

    builder
        .plugin(tauri_plugin_aptabase::Builder::new("A-US-6435241436").build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .on_window_event(|window, event| {
            // Hide the dropdown when it loses focus, mirroring the macOS
            // `window_did_resign_key` behavior in the NSPanel backend.
            #[cfg(not(target_os = "macos"))]
            if let tauri::WindowEvent::Focused(false) = event {
                use tauri::Manager;
                if window.label() == "main"
                    && panel::should_hide_on_blur()
                    && !panel::within_show_grace()
                {
                    // Route through the panel so "keep on taskbar" can
                    // minimize instead of hide. The grace check ignores the
                    // spurious blur fired right after the tray click opens it.
                    panel::hide_panel(window.app_handle());
                }
            }
            #[cfg(target_os = "macos")]
            {
                let _ = (window, event);
            }
        })
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .max_file_size(10_000_000) // 10 MB
                .level(log::LevelFilter::Trace) // Allow all levels; runtime filter via tray menu
                .level_for("hyper", log::LevelFilter::Warn)
                .level_for("reqwest", log::LevelFilter::Warn)
                .level_for("tao", log::LevelFilter::Info)
                .level_for("tauri_plugin_updater", log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            init_panel,
            hide_panel,
            set_panel_pinned,
            set_panel_stay_open_when_pinned,
            set_panel_keep_on_taskbar,
            open_devtools,
            start_probe_batch,
            list_plugins,
            get_log_path,
            update_global_shortcut
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            #[cfg(target_os = "macos")]
            {
                app_nap::disable_app_nap();
                webkit_config::disable_webview_suspension(app.handle());
            }

            use tauri::Manager;

            let version = app.package_info().version.to_string();
            log::info!("Tokenmaxxing v{} starting", version);

            // Load config early (lazy init via OnceLock, zero-cost after)
            let _proxy = config::get_resolved_proxy();

            track_daily_active_if_needed(app.handle());
            #[cfg(desktop)]
            spawn_daily_active_rollover_tracker(app.handle().clone());

            let app_data_dir = app.path().app_data_dir().expect("no app data dir");
            let resource_dir = app.path().resource_dir().expect("no resource dir");
            let app_data_dir_tail = app_data_dir
                .file_name()
                .and_then(|value| value.to_str())
                .unwrap_or("unknown");
            let redacted_app_data_dir =
                plugin_engine::host_api::redact_log_message(&app_data_dir.display().to_string());
            log::debug!(
                "app_data_dir: tail={}, path={}",
                app_data_dir_tail,
                redacted_app_data_dir
            );

            let (_, plugins) = plugin_engine::initialize_plugins(&app_data_dir, &resource_dir);
            let known_plugin_ids: Vec<String> =
                plugins.iter().map(|p| p.manifest.id.clone()).collect();
            app.manage(Mutex::new(AppState {
                plugins,
                app_data_dir: app_data_dir.clone(),
                app_version: app.package_info().version.to_string(),
            }));

            local_http_api::init(&app_data_dir, known_plugin_ids);
            local_http_api::start_server();

            tray::create(app.handle())?;

            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;

            #[cfg(desktop)]
            register_initial_shortcut(app.handle());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_, event| match event {
            tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
                local_http_api::flush_cache();
            }
            _ => {}
        });
}