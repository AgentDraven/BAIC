//! macOS panel backend — native `NSPanel` via `tauri-nspanel`.

use tauri::{AppHandle, Position, Size};
use tauri_nspanel::{
    CollectionBehavior, ManagerExt, PanelLevel, StyleMask, WebviewWindowExt, tauri_panel,
};

use super::{PanelPlacement, compute_placement};

unsafe fn set_panel_frame_top_left(panel: &tauri_nspanel::NSPanel, x: f64, y: f64) {
    let point = tauri_nspanel::NSPoint::new(x, y);
    let _: () = objc2::msg_send![panel, setFrameTopLeftPoint: point];
}

fn set_panel_top_left_immediately(
    window: &tauri::WebviewWindow,
    app_handle: &AppHandle,
    panel_x: f64,
    panel_y: f64,
    primary_logical_h: f64,
) {
    let Ok(panel_handle) = app_handle.get_webview_panel("main") else {
        return;
    };

    let target_x = panel_x;
    // AppKit uses a bottom-left origin, so flip the y into screen space.
    let target_y = primary_logical_h - panel_y;

    if objc2_foundation::MainThreadMarker::new().is_some() {
        unsafe {
            set_panel_frame_top_left(panel_handle.as_panel(), target_x, target_y);
        }
        return;
    }

    let (tx, rx) = std::sync::mpsc::channel();
    let panel_handle = panel_handle.clone();

    if let Err(error) = window.run_on_main_thread(move || {
        unsafe {
            set_panel_frame_top_left(panel_handle.as_panel(), target_x, target_y);
        }
        let _ = tx.send(());
    }) {
        log::warn!("Failed to position panel on main thread: {}", error);
        return;
    }

    if rx.recv().is_err() {
        log::warn!("Failed waiting for panel position on main thread");
    }
}

/// Get the existing panel, initializing it if needed. Returns `None` on error.
fn get_or_init_panel(app_handle: &AppHandle) -> Option<tauri_nspanel::Panel> {
    match app_handle.get_webview_panel("main") {
        Ok(panel) => Some(panel),
        Err(_) => {
            if let Err(err) = init(app_handle) {
                log::error!("Failed to init panel: {}", err);
                None
            } else {
                match app_handle.get_webview_panel("main") {
                    Ok(panel) => Some(panel),
                    Err(err) => {
                        log::error!("Panel missing after init: {:?}", err);
                        None
                    }
                }
            }
        }
    }
}

/// Retrieve the tray icon rect and position the panel beneath it.
fn position_panel_from_tray(app_handle: &AppHandle) {
    use tauri::Manager;
    let Some(tray) = app_handle.tray_by_id("tray") else {
        log::debug!("position_panel_from_tray: tray icon not found");
        return;
    };
    match tray.rect() {
        Ok(Some(rect)) => position_panel_at_tray_icon(app_handle, rect.position, rect.size),
        Ok(None) => log::debug!("position_panel_from_tray: tray rect not available yet"),
        Err(e) => log::warn!("position_panel_from_tray: failed to get tray rect: {}", e),
    }
}

pub fn show_panel(app_handle: &AppHandle) {
    if let Some(panel) = get_or_init_panel(app_handle) {
        panel.show_and_make_key();
        position_panel_from_tray(app_handle);
    }
}

pub fn hide_panel(app_handle: &AppHandle) {
    if let Ok(panel) = app_handle.get_webview_panel("main") {
        panel.hide();
    }
}

pub fn is_visible(app_handle: &AppHandle) -> bool {
    app_handle
        .get_webview_panel("main")
        .map(|p| p.is_visible())
        .unwrap_or(false)
}

pub fn toggle_panel(app_handle: &AppHandle) {
    let Some(panel) = get_or_init_panel(app_handle) else {
        return;
    };

    if panel.is_visible() {
        log::debug!("toggle_panel: hiding panel");
        panel.hide();
    } else {
        log::debug!("toggle_panel: showing panel");
        panel.show_and_make_key();
        position_panel_from_tray(app_handle);
    }
}

// Define our panel class and event handler together.
tauri_panel! {
    panel!(TokenmaxxingPanel {
        config: {
            can_become_key_window: true,
            is_floating_panel: true
        }
    })

    panel_event!(TokenmaxxingPanelEventHandler {
        window_did_resign_key(notification: &NSNotification) -> ()
    })
}

pub fn init(app_handle: &AppHandle) -> tauri::Result<()> {
    use tauri::Manager;
    if app_handle.get_webview_panel("main").is_ok() {
        return Ok(());
    }

    let window = app_handle.get_webview_window("main").unwrap();

    let panel = window.to_panel::<TokenmaxxingPanel>()?;

    // Disable native shadow - it causes gray border on transparent windows.
    // Let CSS handle shadow via shadow-xl class.
    panel.set_has_shadow(false);
    panel.set_opaque(false);

    // Configure panel behavior.
    panel.set_level(PanelLevel::MainMenu.value() + 1);

    panel.set_collection_behavior(
        CollectionBehavior::new()
            .move_to_active_space()
            .full_screen_auxiliary()
            .value(),
    );

    panel.set_style_mask(StyleMask::empty().nonactivating_panel().value());

    // Hide the panel when it loses focus.
    let event_handler = TokenmaxxingPanelEventHandler::new();

    let handle = app_handle.clone();
    event_handler.window_did_resign_key(move |_notification| {
        if let Ok(panel) = handle.get_webview_panel("main") {
            panel.hide();
        }
    });

    panel.set_event_handler(Some(event_handler.as_ref()));

    Ok(())
}

pub fn position_panel_at_tray_icon(
    app_handle: &AppHandle,
    icon_position: Position,
    icon_size: Size,
) {
    use tauri::Manager;
    let Some(window) = app_handle.get_webview_window("main") else {
        return;
    };
    let Some(PanelPlacement {
        x,
        y,
        primary_logical_h,
    }) = compute_placement(app_handle, icon_position, icon_size)
    else {
        return;
    };
    set_panel_top_left_immediately(&window, app_handle, x, y, primary_logical_h);
}
