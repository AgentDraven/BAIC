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

use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

use tauri::{AppHandle, Manager, Position, Size};

static PANEL_PINNED: AtomicBool = AtomicBool::new(false);
static PANEL_STAY_OPEN_WHEN_PINNED: AtomicBool = AtomicBool::new(false);
static PANEL_KEEP_ON_TASKBAR: AtomicBool = AtomicBool::new(false);

/// Sets whether the panel stays open as a draggable widget (Windows/Linux only).
/// macOS ignores this flag — the NSPanel backend never reads it.
pub fn set_pinned(pinned: bool) {
    PANEL_PINNED.store(pinned, Ordering::Relaxed);
}

/// Returns whether the panel is pinned as a widget (Windows/Linux only).
/// macOS ignores this flag — the NSPanel backend never reads it.
pub fn is_pinned() -> bool {
    PANEL_PINNED.load(Ordering::Relaxed)
}

/// When pinned, keep the panel visible after it loses focus (Windows/Linux only).
/// If false, a pinned widget can be hidden by clicking away while staying pinned.
pub fn set_stay_open_when_pinned(stay_open: bool) {
    PANEL_STAY_OPEN_WHEN_PINNED.store(stay_open, Ordering::Relaxed);
}

pub fn stay_open_when_pinned() -> bool {
    PANEL_STAY_OPEN_WHEN_PINNED.load(Ordering::Relaxed)
}

/// When enabled, dismissing the panel minimizes it instead of hiding it, so
/// the app keeps a taskbar button while running (Windows/Linux only).
/// macOS ignores this flag — the NSPanel backend never reads it.
pub fn set_keep_on_taskbar(keep: bool) {
    PANEL_KEEP_ON_TASKBAR.store(keep, Ordering::Relaxed);
}

pub fn keep_on_taskbar() -> bool {
    PANEL_KEEP_ON_TASKBAR.load(Ordering::Relaxed)
}

/// Hide on blur unless the panel is in keep-on-taskbar mode. In
/// keep-on-taskbar mode the panel behaves like a normal window and never
/// auto-hides on focus loss; otherwise hide on blur unless pinned and
/// configured to stay open.
pub fn should_hide_on_blur() -> bool {
    if keep_on_taskbar() {
        return false;
    }
    !is_pinned() || !stay_open_when_pinned()
}

/// Whether the panel window should float above everything.
///
/// The pinned widget (with its overlay bar) and the classic tray dropdown stay
/// on top. The default keep-on-taskbar window mode does NOT — clicking another
/// window drops the panel behind it, like a normal app window.
pub fn wants_always_on_top() -> bool {
    is_pinned() || !keep_on_taskbar()
}

static PANEL_SHOWN_AT: Mutex<Option<Instant>> = Mutex::new(None);

const SHOW_GRACE: Duration = Duration::from_millis(500);

/// Record that the panel was just shown. Used to ignore the spurious blur
/// that fires right after show on Windows/Linux (the tray click briefly holds
/// focus, which would otherwise hide/minimize the panel the instant it opens).
pub fn mark_shown() {
    if let Ok(mut guard) = PANEL_SHOWN_AT.lock() {
        *guard = Some(Instant::now());
    }
}

/// True for ~500ms after the last `mark_shown()` call.
pub fn within_show_grace() -> bool {
    PANEL_SHOWN_AT
        .lock()
        .ok()
        .and_then(|guard| guard.as_ref().map(|t| t.elapsed() < SHOW_GRACE))
        .unwrap_or(false)
}

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
    apply_pinned, hide_panel, init, is_visible, position_panel_at_tray_icon, show_panel,
    toggle_panel,
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
    // Only the macOS backend flips into AppKit's bottom-left origin.
    #[cfg_attr(not(target_os = "macos"), allow(dead_code))]
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

    // Panel height, same strategy as the width above.
    let panel_height = match (window.outer_size(), window.scale_factor()) {
        (Ok(s), Ok(win_scale)) => s.height as f64 / win_scale,
        _ => {
            let conf: serde_json::Value = serde_json::from_str(include_str!("../../tauri.conf.json"))
                .expect("tauri.conf.json must be valid JSON");
            conf["app"]["windows"][0]["height"]
                .as_f64()
                .expect("height must be set in tauri.conf.json")
        }
    };

    let mon_logical_w = monitor.size().width as f64 / target_scale;
    let mon_logical_h = monitor.size().height as f64 / target_scale;

    let icon_center_x = icon_logical_x + (icon_logical_w / 2.0);
    // Keep the panel fully on the monitor horizontally (a tray icon near the
    // right edge would otherwise push it partially off-screen).
    let panel_x = (icon_center_x - (panel_width / 2.0))
        .min(mon_logical_x + mon_logical_w - panel_width)
        .max(mon_logical_x);
    let nudge_up: f64 = 6.0;
    let below_y = icon_logical_y + icon_logical_h - nudge_up;
    // macOS: the menu bar is at the top, so the panel drops below the icon.
    // Windows/Linux: the tray usually sits in a bottom taskbar — dropping
    // below would render off-screen, so open the panel above the icon.
    let panel_y = if below_y + panel_height > mon_logical_y + mon_logical_h {
        (icon_logical_y - panel_height - nudge_up).max(mon_logical_y)
    } else {
        // Clamp to the monitor's top edge: when the menu bar is set to
        // auto-hide, the tray rect sits above the visible screen, which would
        // otherwise push the panel's top edge off-screen and clip it.
        below_y.max(mon_logical_y)
    };

    Some(PanelPlacement {
        x: panel_x,
        y: panel_y,
        primary_logical_h,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    // Flags are global atomics, so run this as a single sequential test
    // to avoid races with other tests in the same process.
    #[test]
    fn should_hide_on_blur_flag_matrix() {
        // keep_on_taskbar=true wins regardless of pinned/stay_open
        set_keep_on_taskbar(true);
        set_pinned(false);
        set_stay_open_when_pinned(false);
        assert!(!should_hide_on_blur());

        set_keep_on_taskbar(true);
        set_pinned(true);
        set_stay_open_when_pinned(false);
        assert!(!should_hide_on_blur());

        set_keep_on_taskbar(true);
        set_pinned(true);
        set_stay_open_when_pinned(true);
        assert!(!should_hide_on_blur());

        // keep_on_taskbar=false + unpinned -> hide
        set_keep_on_taskbar(false);
        set_pinned(false);
        set_stay_open_when_pinned(false);
        assert!(should_hide_on_blur());

        set_keep_on_taskbar(false);
        set_pinned(false);
        set_stay_open_when_pinned(true);
        assert!(should_hide_on_blur());

        // keep_on_taskbar=false + pinned + stay_open=true -> stay
        set_keep_on_taskbar(false);
        set_pinned(true);
        set_stay_open_when_pinned(true);
        assert!(!should_hide_on_blur());

        // keep_on_taskbar=false + pinned + stay_open=false -> hide
        set_keep_on_taskbar(false);
        set_pinned(true);
        set_stay_open_when_pinned(false);
        assert!(should_hide_on_blur());

        // Reset to defaults so we don't leak state into other tests.
        set_keep_on_taskbar(false);
        set_pinned(false);
        set_stay_open_when_pinned(false);
    }
}
