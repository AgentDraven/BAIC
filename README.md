# Tokenmaxxing — track all your AI coding subscriptions in one place

See your usage at a glance from your menu/task bar. No digging through dashboards.

> **Tokenmaxxing is a community fork of [OpenUsage](https://github.com/robinebers/openusage) by [Robin Ebers](https://github.com/robinebers).**
> It is **not** affiliated with, endorsed by, or an official part of OpenUsage. The goal of this fork is to bring the app to **Windows and Linux** in addition to macOS. All original credit for the design and the vast majority of the code goes to the OpenUsage authors — see [CREDITS.md](CREDITS.md).

## Platform status

| Platform | Status |
|----------|--------|
| **macOS** (Apple Silicon & Intel) | ✅ Works (inherited from OpenUsage) |
| **Windows** | ✅ Builds (NSIS installer via CI) — beta, feedback welcome |
| **Linux** | ✅ Works — deb / rpm / AppImage, verified on a live system |

The macOS dropdown uses a native `NSPanel`; on Windows/Linux it's a borderless always-on-top Tauri window. Port details in [PORTING.md](PORTING.md). Windows and Linux packages are built by CI on every push to `master` (grab them from the latest [Build Desktop run artifacts](../../actions/workflows/build-desktop.yml)); Linux additionally supports a headless server + [remote web dashboard](remote/README.md) setup.

## What It Does

Tokenmaxxing lives in your menu/task bar and shows how much of your AI coding subscriptions you've used. Progress bars, badges, and clear labels. No mental math required.

- **One glance.** All your AI tools, one panel.
- **Always up-to-date.** Refreshes automatically on a schedule you pick.
- **Global shortcut.** Toggle the panel from anywhere with a customizable keyboard shortcut.
- **Lightweight.** Opens instantly, stays out of your way.
- **Plugin-based.** New providers get added without updating the whole app.
- **[Local HTTP API](docs/local-http-api.md).** Other apps can read your usage data from `127.0.0.1:6736`.
- **[Proxy support](docs/proxy.md).** Route provider HTTP requests through a SOCKS5 or HTTP proxy.

## Supported Providers

- [**Amp**](docs/providers/amp.md) / free tier, bonus, credits
- [**Antigravity**](docs/providers/antigravity.md) / all models
- [**Claude**](docs/providers/claude.md) / session, weekly, extra usage, local token usage (ccusage)
- [**Codex**](docs/providers/codex.md) / session, weekly, reviews, credits
- [**Copilot**](docs/providers/copilot.md) / premium, chat, completions
- [**Cursor**](docs/providers/cursor.md) / credits, total usage, auto usage, API usage, on-demand, CLI auth
- [**Factory / Droid**](docs/providers/factory.md) / standard, premium tokens
- [**Grok**](docs/providers/grok.md) / credits used, plan, pay-as-you-go cap
- [**JetBrains AI Assistant**](docs/providers/jetbrains-ai-assistant.md) / quota, remaining
- [**Kiro**](docs/providers/kiro.md) / credits, bonus credits, overages
- [**Kimi Code**](docs/providers/kimi.md) / session, weekly
- [**MiniMax**](docs/providers/minimax.md) / coding plan session
- [**OpenCode Go**](docs/providers/opencode-go.md) / 5h, weekly, monthly spend limits
- [**Devin**](docs/providers/devin.md) / weekly quota, extra usage
- [**Z.ai**](docs/providers/zai.md) / session, weekly, web searches

Want a provider that's not listed? [Open an issue.](https://github.com/falkoro/tokenmaxxing/issues/new)

## Credits

Tokenmaxxing is a fork of **[OpenUsage](https://github.com/robinebers/openusage)** by **[Robin Ebers](https://github.com/robinebers)** (MIT licensed). OpenUsage was in turn inspired by [CodexBar](https://github.com/steipete/CodexBar) by [@steipete](https://github.com/steipete). Full attribution in [CREDITS.md](CREDITS.md).

This fork uses a different name and icon per the upstream [trademark policy](https://github.com/robinebers/openusage/blob/main/TRADEMARK.md): the "OpenUsage" name and logo are trademarks of Robin Ebers and are **not** used here.

## License

[MIT](LICENSE) — see the license for the original copyright notice, which is retained.

---

<details>
<summary><strong>Build from source</strong></summary>

> **Warning**: The `master` branch may contain unreleased / in-progress (Windows/Linux) work and may not be stable.

### Stack

- **[Tauri 2](https://tauri.app)** (Rust backend + system webview)
- **React 19 + TypeScript + Vite** frontend
- **Bun** package manager
- Plugin-based providers (bundled JS plugins in `plugins/`)

### Prerequisites

- [Rust](https://rustup.rs) toolchain
- [Bun](https://bun.sh)
- Platform Tauri prerequisites: see <https://tauri.app/start/prerequisites/>
  (Linux needs `webkit2gtk`/`libgtk` dev packages; Windows needs the WebView2 runtime + MSVC build tools.)

### Run

```bash
bun install
bun run tauri dev      # dev
bun run tauri build    # release bundle for the current OS
```

</details>
