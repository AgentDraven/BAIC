//! Non-macOS panel backend (Windows / Linux).
//!
//! There is no `NSPanel` outside macOS, so the app's main `WebviewWindow` doubles
//! as the dropdown. In keep-on-taskbar mode it behaves like a normal window
//! (not always-on-top, no blur-hide) so the user can keep working with the
//! panel open. In tray-dropdown mode it is borderless, always-on-top, shown
//! and positioned under the tray icon and hidden again when it loses focus
//! (the focus-out hide is wired up in `lib.rs` via `on_window_event`).

use tauri::{AppHandle, LogicalPosition, Manager, Position, Size};

use super::{PanelPlacement, compute_placement};

/// Configure the main window for the current mode. In keep-on-taskbar mode the
/// window is a normal window (not always-on-top). In tray-dropdown mode it is
/// borderless and always-on-top. Idempotent.
pub fn init(app_handle: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.set_always_on_top(!super::keep_on_taskbar());
        let _ = window.set_skip_taskbar(false);
    }
    Ok(())
}

pub fn is_visible(app_handle: &AppHandle) -> bool {
    app_handle
        .get_webview_window("main")
        .map(|w| {
            // A minimized window still reports is_visible() == true, but for
            // toggle purposes it is dismissed.
            w.is_visible().unwrap_or(false) && !w.is_minimized().unwrap_or(false)
        })
        .unwrap_or(false)
}

pub fn hide_panel(app_handle: &AppHandle) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if super::keep_on_taskbar() {
            // Minimize instead of hiding so the taskbar button stays alive
            // (a hidden window loses its taskbar presence, which also made
            // right-clicking the taskbar button act on a vanished window).
            let _ = window.minimize();
        } else {
            let _ = window.hide();
        }
    }
}

pub fn show_panel(app_handle: &AppHandle) {
    let _ = init(app_handle);
    if let Some(window) = app_handle.get_webview_window("main") {
        let was_minimized = window.is_minimized().unwrap_or(false);
        if was_minimized {
            let _ = window.unminimize();
        }
        // Position BEFORE show so the panel appears under the tray icon
        // straight away, instead of flashing at its old spot and jumping.
        // Restoring from minimize keeps the spot the user dragged it to;
        // pinned mode also stays put.
        if !super::is_pinned() && !was_minimized {
            position_panel_from_tray(app_handle);
        }
        let _ = window.show();
        let _ = window.set_focus();
    }
    super::mark_shown();
}

pub fn toggle_panel(app_handle: &AppHandle) {
    if is_visible(app_handle) {
        log::debug!("toggle_panel: hiding panel");
        hide_panel(app_handle);
    } else {
        log::debug!("toggle_panel: showing panel");
        show_panel(app_handle);
    }
}

fn position_panel_from_tray(app_handle: &AppHandle) {
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

pub fn position_panel_at_tray_icon(
    app_handle: &AppHandle,
    icon_position: Position,
    icon_size: Size,
) {
    let Some(window) = app_handle.get_webview_window("main") else {
        return;
    };
    let Some(PanelPlacement { x, y, .. }) =
        compute_placement(app_handle, icon_position, icon_size)
    else {
        return;
    };
    // Windows/Linux use a top-left origin, so the logical placement maps directly.
    if let Err(e) = window.set_position(Position::Logical(LogicalPosition::new(x, y))) {
        log::warn!("failed to position panel window: {}", e);
    }
}
