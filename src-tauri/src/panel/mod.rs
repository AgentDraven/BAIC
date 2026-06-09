//! Cross-platform dropdown panel.
//!
//! On macOS the panel is a native `NSPanel` (via `tauri-nspanel`) so it can float
//! above full-screen apps and never steals focus from the active app. On Windows
//! and Linux there is no NSPanel, so we use the app's main `WebviewWindow` as a
//! borderless, always-on-top, skip-taskbar dropdown instead.
//!
//! Both backends expose the same free-function API:
//! `init`, `show_panel`, `hide_panel`, `toggle_panel`, `is_visible`,
//! `position_panel_at_tray_icon`.

use tauri::{AppHandle, Manager, Position, Size};

#[cfg(target_os = "macos")]
mod macos;
#[cfg(target_os = "macos")]
pub use macos::{
    hide_panel, init, is_visible, position_panel_at_tray_icon, show_panel, toggle_panel,
};

#[cfg(not(target_os = "macos"))]
mod other;
#[cfg(not(target_os = "macos"))]
pub use other::{
    hide_panel, init, is_visible, position_panel_at_tray_icon, show_panel, toggle_panel,
};

fn monitor_contains_physical_point(
    origin_x: f64,
    origin_y: f64,
    width: f64,
    height: f64,
    point_x: f64,
    point_y: f64,
) -> bool {
    point_x >= origin_x
        && point_x < origin_x + width
        && point_y >= origin_y
        && point_y < origin_y + height
}

/// The computed top-left target for the panel, in logical (scale-independent)
/// coordinates, plus the primary monitor's logical height (needed by the macOS
/// backend to flip into AppKit's bottom-left origin).
pub(crate) struct PanelPlacement {
    pub x: f64,
    pub y: f64,
    pub primary_logical_h: f64,
}

/// Shared geometry: given the tray icon's rect, work out where the panel's
/// top-left corner should go (centered under the icon, clamped to the monitor).
/// Returns `None` if no suitable monitor/window is available.
pub(crate) fn compute_placement(
    app_handle: &AppHandle,
    icon_position: Position,
    icon_size: Size,
) -> Option<PanelPlacement> {
    let window = app_handle.get_webview_window("main")?;

    let (icon_phys_x, icon_phys_y) = match &icon_position {
        Position::Physical(pos) => (pos.x as f64, pos.y as f64),
        Position::Logical(pos) => (pos.x, pos.y),
    };
    let (icon_phys_w, icon_phys_h) = match &icon_size {
        Size::Physical(s) => (s.width as f64, s.height as f64),
        Size::Logical(s) => (s.width, s.height),
    };

    let monitors = window.available_monitors().ok()?;
    let primary_logical_h = window
        .primary_monitor()
        .ok()
        .flatten()
        .map(|m| m.size().height as f64 / m.scale_factor())
        .unwrap_or(0.0);

    let icon_center_x = icon_phys_x + (icon_phys_w / 2.0);
    let icon_center_y = icon_phys_y + (icon_phys_h / 2.0);

    let found_monitor = monitors.iter().find(|monitor| {
        let origin = monitor.position();
        let size = monitor.size();
        monitor_contains_physical_point(
            origin.x as f64,
            origin.y as f64,
            size.width as f64,
            size.height as f64,
            icon_center_x,
            icon_center_y,
        )
    });

    let monitor = match found_monitor {
        Some(m) => m.clone(),
        None => {
            log::warn!(
                "No monitor found for tray rect center at ({:.0}, {:.0}), using primary",
                icon_center_x,
                icon_center_y
            );
            window.primary_monitor().ok().flatten()?
        }
    };

    let target_scale = monitor.scale_factor();
    let mon_phys_x = monitor.position().x as f64;
    let mon_phys_y = monitor.position().y as f64;
    let mon_logical_x = mon_phys_x / target_scale;
    let mon_logical_y = mon_phys_y / target_scale;

    let icon_logical_x = mon_logical_x + (icon_phys_x - mon_phys_x) / target_scale;
    let icon_logical_y = mon_logical_y + (icon_phys_y - mon_phys_y) / target_scale;
    let icon_logical_w = icon_phys_w / target_scale;
    let icon_logical_h = icon_phys_h / target_scale;

    // Read panel width from the window, converted to logical points.
    // outer_size() returns physical pixels at the window's current scale factor.
    // If the window isn't available yet, parse the configured width from tauri.conf.json
    // (embedded at compile time) so it stays in sync automatically.
    let panel_width = match (window.outer_size(), window.scale_factor()) {
        (Ok(s), Ok(win_scale)) => s.width as f64 / win_scale,
        _ => {
            let conf: serde_json::Value = serde_json::from_str(include_str!("../../tauri.conf.json"))
                .expect("tauri.conf.json must be valid JSON");
            conf["app"]["windows"][0]["width"]
                .as_f64()
                .expect("width must be set in tauri.conf.json")
        }
    };

    let icon_center_x = icon_logical_x + (icon_logical_w / 2.0);
    let panel_x = icon_center_x - (panel_width / 2.0);
    let nudge_up: f64 = 6.0;
    // Clamp to the monitor's top edge: when the menu bar is set to auto-hide,
    // the tray rect sits above the visible screen, which would otherwise push
    // the panel's top edge off-screen and clip it.
    let panel_y = (icon_logical_y + icon_logical_h - nudge_up).max(mon_logical_y);

    Some(PanelPlacement {
        x: panel_x,
        y: panel_y,
        primary_logical_h,
    })
}
