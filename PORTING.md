# Porting Tokenmaxxing to Windows & Linux

Upstream OpenUsage targets **macOS only**. This document tracks the work to make the
app compile and run on **Windows** and **Linux**. Tauri itself is cross-platform; the
blockers are the macOS-native pieces.

## Status

| Platform | Compiles | Runs | Notes |
|----------|:--------:|:----:|-------|
| macOS    | ✅ | ✅ | Native `NSPanel` backend, unchanged behavior |
| Linux    | ✅ | ✅ | deb/rpm/AppImage build; app + tray + plugin probes + local HTTP API verified live (under Xvfb on a headless server) |
| Windows  | ✅ | ⏳ | NSIS installer builds clean in CI (`build-desktop.yml`); awaiting first run-test on real Windows |

Compile status is checked per-OS in `.github/workflows/ci.yml`; installable
packages are produced by `.github/workflows/build-desktop.yml` on every push
to `master` (Windows NSIS + Linux deb/rpm/AppImage, as run artifacts).

## What the port did

The macOS-only pieces were put behind a platform abstraction in `src/panel/`:

- `src/panel/mod.rs` — public free-function API (`init`, `show_panel`, `hide_panel`,
  `toggle_panel`, `is_visible`, `position_panel_at_tray_icon`) + the shared
  tray-icon → panel placement geometry (`compute_placement`).
- `src/panel/macos.rs` — the original `NSPanel`/`tauri-nspanel`/`objc2` backend,
  now `#[cfg(target_os = "macos")]`.
- `src/panel/other.rs` — Windows/Linux backend: the main `WebviewWindow` as a
  borderless, always-on-top, skip-taskbar dropdown.

`Cargo.toml` moved `tauri-nspanel` under `[target.'cfg(target_os = "macos")']`.
`lib.rs` registers the `tauri_nspanel` plugin only on macOS and hides the window on
focus-loss (`on_window_event` → `WindowEvent::Focused(false)`) on other platforms,
mirroring macOS's `window_did_resign_key`. `tray.rs` no longer depends on
`tauri-nspanel` and calls the free-function API.

The **Antigravity** provider is deferred ("pending"): it's excluded from the bundled
plugins in `copy-bundled.cjs` because it reads the macOS keychain + `~/Library`
paths. Re-enable once a cross-platform auth path exists.

## Blockers (macOS-only code in `src-tauri/src/`)

1. **`panel.rs` — the dropdown window.** This is the main blocker. It is declared
   unconditionally in `lib.rs` (`mod panel;`) and uses the macOS-only crate
   [`tauri-nspanel`](https://github.com/ahkohd/tauri-nspanel) plus `objc2`/AppKit
   (`NSPanel`, `setFrameTopLeftPoint:`, collection behavior, panel levels). None of
   this exists on Windows/Linux.
   - **Plan:** introduce a platform abstraction — keep the `NSPanel` implementation
     behind `#[cfg(target_os = "macos")]`, and add a `#[cfg(not(target_os = "macos"))]`
     implementation that uses a normal borderless, always-on-top Tauri
     `WebviewWindow` positioned near the tray/cursor, with hide-on-blur wired up via
     `WindowEvent::Focused(false)`.
   - The `tauri-nspanel` dependency and `app.get_webview_panel(...)` calls in `lib.rs`
     (`init_panel`, `hide_panel`, `toggle_panel`) must move behind the same cfg gate.

2. **`tray.rs`** — uses `tauri_nspanel::ManagerExt` (line 6). Tauri's own `tray-icon`
   is cross-platform; only the nspanel import needs gating. Tray icons on Linux need
   `libappindicator`/`libayatana-appindicator` (handled in CI deps).

3. **`webkit_config.rs`** — already `#[cfg(target_os = "macos")]` in `lib.rs`. It
   disables WebKit background suspension (macOS WKWebView only). No-op needed
   elsewhere; the cfg gate already handles this.

4. **`app_nap.rs`** — already `#[cfg(target_os = "macos")]`. macOS App Nap only. Fine.

5. **`Cargo.toml`** — the `objc2*` deps are already under
   `[target.'cfg(target_os = "macos")'.dependencies]`. The `tauri-nspanel` git
   dependency, however, is currently unconditional and must become macOS-only.

## Platform runtime prerequisites

- **Linux:** `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libappindicator3-dev`,
  `librsvg2-dev`, `patchelf` (see the CI workflow).
- **Windows:** WebView2 runtime (preinstalled on Win 11) + MSVC build tools.

## Release pipeline

`.github/workflows/publish.yml` still builds **macOS only** (two Apple targets),
unchanged from upstream. Once the Windows/Linux builds are green in `ci.yml`, add
`windows-latest` and `ubuntu-latest` to the publish matrix and guard the Apple
signing/notarization steps with `if: runner.os == 'macOS'`. The Tauri updater
endpoint already points at this fork (`falkoro/tokenmaxxing`); a fork-owned
updater signing key (`TAURI_SIGNING_PRIVATE_KEY`) must be generated before shipping
auto-updates — the inherited public key in `tauri.conf.json` belongs to upstream and
will not validate fork-signed artifacts.

## Suggested order of work

1. Gate `tauri-nspanel` + `objc2` panel code behind `cfg(target_os = "macos")`.
2. Add the non-macOS `WebviewWindow` panel implementation in `panel.rs`.
3. Get `cargo build` green on Linux, then Windows (CI `rust-build` matrix).
4. Manual smoke test: tray icon shows, panel toggles, providers refresh.
5. Wire Windows/Linux into `publish.yml` and generate a fork updater key.
