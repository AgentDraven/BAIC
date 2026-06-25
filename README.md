# Tokenmaxxing — every AI coding subscription, one glance

Claude, Codex, Cursor, Copilot, Grok, Kimi, Z.ai… all your AI usage in your task
bar. No dashboards, no tab-digging, no mental math.

<p align="center">
  <img src="docs/media/panel.png" alt="Tokenmaxxing panel showing Claude, Codex, Cursor, Copilot and Grok usage with progress bars, plan badges and pace indicators" width="340">
</p>

> **The Windows + Linux build of [OpenUsage](https://github.com/robinebers/openusage).**
> OpenUsage is a macOS menu-bar app by [Robin Ebers](https://github.com/robinebers) — and it only runs on macOS.
> Tokenmaxxing is the community port that brings it to **Windows and Linux**. Not affiliated with or endorsed by OpenUsage; all original design and credit go to its authors — see [CREDITS.md](CREDITS.md).

## Platform status

| Platform | Status |
|----------|--------|
| **Windows** | ✅ NSIS installer, auto-updates. Beta — feedback welcome. |
| **Linux** | ✅ deb / rpm / AppImage, auto-updates. |
| **macOS** | Use **[OpenUsage](https://github.com/robinebers/openusage)** — it's native there and this fork doesn't ship a macOS build. |

The panel is a borderless, always-on-top window driven by a global shortcut. (On macOS, OpenUsage uses a native `NSPanel`; that code is kept but unshipped — port notes in [PORTING.md](PORTING.md).)

## Download

**[⬇ Latest release](https://github.com/falkoro/tokenmaxxing/releases/latest)** — pick your platform:

- **Windows**: `Tokenmaxxing_<version>_x64-setup.exe` (SmartScreen warns — unsigned; *More info → Run anyway*)
- **Debian/Ubuntu**: `Tokenmaxxing_<version>_amd64.deb`
- **Fedora/openSUSE**: `Tokenmaxxing-<version>-1.x86_64.rpm`
- **Any Linux**: `Tokenmaxxing_<version>_amd64.AppImage` (`chmod +x`, then run)

It **auto-updates**: checks GitHub releases every 15 minutes and updates in place. Fresh per-commit builds are also published as [Build Desktop artifacts](../../actions/workflows/build-desktop.yml) (requires GitHub login).

## What it does

Tokenmaxxing lives in your task bar and shows how much of each AI subscription you've burned — progress bars, plan badges, and pace indicators that warn you *before* you run dry.

- **One glance.** Every AI tool, one panel.
- **Pace-aware.** Green/amber/red dots flag when you're on track to run out early.
- **Always fresh.** Refreshes on a schedule you pick.
- **Global shortcut.** Toggle the panel from anywhere.
- **Plugin-based.** New providers ship without app updates.
- **[Local HTTP API](docs/local-http-api.md).** Read your usage from `127.0.0.1:6736`.
- **[Proxy support](docs/proxy.md).** Route provider requests through SOCKS5 / HTTP.
- **[Remote dashboard](remote/README.md).** Serve your usage to other machines.

## Supported providers

[Amp](docs/providers/amp.md) ·
[Claude](docs/providers/claude.md) ·
[Codex](docs/providers/codex.md) ·
[Copilot](docs/providers/copilot.md) ·
[Cursor](docs/providers/cursor.md) ·
[Devin](docs/providers/devin.md) ·
[Factory / Droid](docs/providers/factory.md) ·
[Grok](docs/providers/grok.md) ·
[JetBrains AI Assistant](docs/providers/jetbrains-ai-assistant.md) ·
[Kimi Code](docs/providers/kimi.md) ·
[Kiro](docs/providers/kiro.md) ·
[MiniMax](docs/providers/minimax.md) ·
[OpenCode Go](docs/providers/opencode-go.md) ·
[Perplexity](docs/providers/perplexity.md) ·
[Synthetic](docs/providers/synthetic.md) ·
[Z.ai](docs/providers/zai.md)

Missing one? [Open an issue.](https://github.com/falkoro/tokenmaxxing/issues/new) (Antigravity is ported but macOS-only for now — pending a cross-platform auth path.)

## Credits

A fork of **[OpenUsage](https://github.com/robinebers/openusage)** by **[Robin Ebers](https://github.com/robinebers)** (MIT), itself inspired by [CodexBar](https://github.com/steipete/CodexBar). Full attribution in [CREDITS.md](CREDITS.md). Per the upstream [trademark policy](https://github.com/robinebers/openusage/blob/main/TRADEMARK.md), the "OpenUsage" name and logo are **not** used here — different name, different icon.

## License

[MIT](LICENSE) — the original copyright notice is retained.

---

<details>
<summary><strong>Build from source</strong></summary>

> **Warning**: `master` may contain unreleased Windows/Linux work and may be unstable.

**Stack:** [Tauri 2](https://tauri.app) (Rust + system webview) · React 19 + TypeScript + Vite · Bun · plugin-based providers (`plugins/`).

**Prerequisites:** [Rust](https://rustup.rs), [Bun](https://bun.sh), and your platform's [Tauri prerequisites](https://tauri.app/start/prerequisites/) (Linux: `webkit2gtk`/`libgtk` dev packages; Windows: WebView2 runtime + MSVC build tools).

```bash
bun install
bun run tauri dev      # dev
bun run tauri build    # release bundle for the current OS
```

</details>
