//! Non-macOS panel backend (Windows / Linux).
//!
//! There is no `NSPanel` outside macOS, so the app's main `WebviewWindow` doubles
//! as the dropdown. In keep-on-taskbar mode it behaves like a normal window
//! (not always-on-top, no blur-hide) so the user can keep working with the
//! panel open. In tray-dropdown mode it is borderless, always-on-top, shown
//! and positioned under the tray icon and hidden again when it loses focus
//! (the focus-out hide is wired up in `lib.rs` via `on_window_event`).

use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, Position, Size};

use super::{PanelPlacement, compute_placement};

// When pinned, the React side renders a thin performance bar at the top of the
// regular full panel (Steam-overlay style quick-glance add-on, not a
// replacement). The window stays at the regular panel size and React sizes it
// to fit content; the Rust side only ensures always-on-top and removes the
// taskbar entry. These constants are the fallback footprint if React's resize
// hasn't run yet.
const PINNED_FALLBACK_WIDTH: f64 = 400.0;
const PINNED_FALLBACK_HEIGHT: f64 = 520.0;
const PINNED_FALLBACK_TOP_MARGIN: f64 = 10.0;

/// Configure the main window for the current mode. Idempotent.
/// - pinned: always-on-top floating widget (thin overlay bar), no taskbar entry
/// - keep-on-taskbar (default): normal window, not always-on-top, keeps its
///   taskbar button so it can be brought back after dropping behind other windows
/// - tray-dropdown (keep-on-taskbar off, unpinned): borderless always-on-top dropdown
pub fn init(app_handle: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.set_always_on_top(super::wants_always_on_top());
        let _ = window.set_skip_taskbar(super::is_pinned());
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

pub fn apply_pinned(app_handle: &AppHandle, pinned: bool) {
    super::set_pinned(pinned);
    let Some(window) = app_handle.get_webview_window("main") else {
        return;
    };

    // set_pinned ran above, so wants_always_on_top() reflects the new state:
    // pinned floats; unpinning reverts to the mode default (normal window in
    // keep-on-taskbar mode).
    let _ = window.set_always_on_top(super::wants_always_on_top());
    let _ = window.set_skip_taskbar(pinned);
    if pinned {
        let _ = window.unminimize();
        let _ = window.show();
        // Don't force a Steam-overlay size: the React tree now renders a thin
        // performance bar at the top of the full panel and resizes the
        // window to fit the panel content. The bar is an extra, not a
        // replacement. If for some reason the React resize hasn't run yet,
        // the fallback below gives a sane default that matches the regular
        // panel footprint.
        position_pinned_fallback(app_handle);
        let _ = window.set_focus();
    }
}

fn position_pinned_fallback(app_handle: &AppHandle) {
    let Some(window) = app_handle.get_webview_window("main") else {
        return;
    };

    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else {
        log::warn!("position_pinned_fallback: no monitor available");
        return;
    };

    let scale = monitor.scale_factor();
    let origin = monitor.position();
    let size = monitor.size();
    let mon_logical_x = origin.x as f64 / scale;
    let mon_logical_y = origin.y as f64 / scale;
    let mon_logical_w = size.width as f64 / scale;

    let width = PINNED_FALLBACK_WIDTH.min((mon_logical_w - 24.0).max(320.0));
    let x = mon_logical_x + ((mon_logical_w - width) / 2.0).max(0.0);
    let y = mon_logical_y + PINNED_FALLBACK_TOP_MARGIN;

    if let Err(e) = window.set_size(Size::Logical(LogicalSize::new(width, PINNED_FALLBACK_HEIGHT)))
    {
        log::warn!("failed to size pinned fallback: {}", e);
    }
    if let Err(e) = window.set_position(Position::Logical(LogicalPosition::new(x, y))) {
        log::warn!("failed to position pinned fallback: {}", e);
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
