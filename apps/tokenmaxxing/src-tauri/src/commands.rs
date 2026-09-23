use std::sync::Mutex;

use serde::Serialize;

use crate::log_path;
use crate::panel;
use crate::plugin_engine;
use crate::plugin_secrets;
use crate::AppState;

fn app_data_dir_from_state(state: &Mutex<AppState>) -> Result<std::path::PathBuf, String> {
    let locked = state.lock().map_err(|e| e.to_string())?;
    Ok(locked.app_data_dir.clone())
}

fn is_whitelisted_env_var(name: &str) -> bool {
    plugin_engine::host_api::is_whitelisted_env_var(name)
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginMeta {
    pub id: String,
    pub name: String,
    pub icon_url: String,
    pub brand_color: Option<String>,
    pub lines: Vec<ManifestLineDto>,
    pub links: Vec<PluginLinkDto>,
    /// Ordered list of primary metric candidates (sorted by primaryOrder).
    /// Frontend picks the first one that exists in runtime data.
    pub primary_candidates: Vec<String>,
    /// Label of the progress line marked `"period": "weekly"`, if any.
    /// Drives the menubar weekly-metric preference.
    pub weekly_candidate: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestLineDto {
    #[serde(rename = "type")]
    pub line_type: String,
    pub label: String,
    pub scope: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginLinkDto {
    pub label: String,
    pub url: String,
}

#[tauri::command]
pub(crate) fn init_panel(app_handle: tauri::AppHandle) {
    panel::init(&app_handle).expect("Failed to initialize panel");
}

#[tauri::command]
pub(crate) fn hide_panel(app_handle: tauri::AppHandle) {
    panel::hide_panel(&app_handle);
}

#[tauri::command]
pub(crate) fn set_panel_pinned(app_handle: tauri::AppHandle, pinned: bool) {
    panel::set_pinned(pinned);
    #[cfg(not(target_os = "macos"))]
    panel::apply_pinned(&app_handle, pinned);
    #[cfg(target_os = "macos")]
    let _ = app_handle;
}

#[tauri::command]
pub(crate) fn set_panel_stay_open_when_pinned(_app_handle: tauri::AppHandle, stay_open: bool) {
    panel::set_stay_open_when_pinned(stay_open);
}

#[tauri::command]
pub(crate) fn set_panel_keep_on_taskbar(app_handle: tauri::AppHandle, keep: bool) {
    panel::set_keep_on_taskbar(keep);
    // Re-apply the window flags so toggling the setting takes effect live
    // (always-on-top on/off).
    #[cfg(not(target_os = "macos"))]
    let _ = panel::init(&app_handle);
    // Turning the flag off while the panel sits minimized on the taskbar
    // would leave a stale button behind — hide it fully instead.
    #[cfg(not(target_os = "macos"))]
    if !keep {
        use tauri::Manager;
        if let Some(window) = app_handle.get_webview_window("main") {
            if window.is_minimized().unwrap_or(false) {
                let _ = window.hide();
            }
        }
    }
    #[cfg(target_os = "macos")]
    let _ = app_handle;
}

#[tauri::command]
pub(crate) fn open_devtools(#[allow(unused)] app_handle: tauri::AppHandle) {
    #[cfg(debug_assertions)]
    {
        use tauri::Manager;
        if let Some(window) = app_handle.get_webview_window("main") {
            window.open_devtools();
        }
    }
}

#[tauri::command]
pub(crate) fn get_log_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    log_path::for_app(&app_handle).map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
pub(crate) fn list_plugins(state: tauri::State<'_, Mutex<AppState>>) -> Vec<PluginMeta> {
    let plugins = {
        let locked = state.lock().expect("plugin state poisoned");
        locked.plugins.clone()
    };
    log::debug!("list_plugins: {} plugins", plugins.len());

    plugins
        .into_iter()
        .map(|plugin| {
            // Extract primary candidates: progress lines with primary_order, sorted by order
            let mut candidates: Vec<_> = plugin
                .manifest
                .lines
                .iter()
                .filter(|line| line.line_type == "progress" && line.primary_order.is_some())
                .collect();
            candidates.sort_by_key(|line| line.primary_order.unwrap());
            let primary_candidates: Vec<String> =
                candidates.iter().map(|line| line.label.clone()).collect();

            // The weekly metric is the progress line declared `"period": "weekly"`.
            let weekly_candidate: Option<String> =
                plugin_engine::manifest::weekly_candidate(&plugin.manifest.lines)
                    .map(str::to_string);

            PluginMeta {
                id: plugin.manifest.id,
                name: plugin.manifest.name,
                icon_url: plugin.icon_data_url,
                brand_color: plugin.manifest.brand_color,
                lines: plugin
                    .manifest
                    .lines
                    .iter()
                    .map(|line| ManifestLineDto {
                        line_type: line.line_type.clone(),
                        label: line.label.clone(),
                        scope: line.scope.clone(),
                    })
                    .collect(),
                links: plugin
                    .manifest
                    .links
                    .iter()
                    .map(|link| PluginLinkDto {
                        label: link.label.clone(),
                        url: link.url.clone(),
                    })
                    .collect(),
                primary_candidates,
                weekly_candidate,
            }
        })
        .collect()
}

#[tauri::command]
pub(crate) fn has_plugin_env_value(
    state: tauri::State<'_, Mutex<AppState>>,
    name: String,
) -> Result<bool, String> {
    if !is_whitelisted_env_var(&name) {
        return Err(format!("env var not allowed: {name}"));
    }

    let app_data_dir = app_data_dir_from_state(state.inner())?;
    let process_value = std::env::var(&name).ok();
    Ok(plugin_secrets::is_env_value_available(
        &app_data_dir,
        &name,
        process_value,
    ))
}

#[tauri::command]
pub(crate) fn set_plugin_env_value(
    state: tauri::State<'_, Mutex<AppState>>,
    name: String,
    value: String,
) -> Result<(), String> {
    if !is_whitelisted_env_var(&name) {
        return Err(format!("env var not allowed: {name}"));
    }

    let app_data_dir = app_data_dir_from_state(state.inner())?;
    plugin_secrets::set_stored_value(&app_data_dir, &name, &value)
}
