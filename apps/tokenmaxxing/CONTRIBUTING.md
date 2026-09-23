# Contributing to Tokenmaxxing

Tokenmaxxing is the **Windows + Linux** community fork of
[OpenUsage](https://github.com/robinebers/openusage). Contributions are welcome, with a
high quality bar. Read this whole document before opening a PR.

> macOS-specific work belongs **upstream** in [OpenUsage](https://github.com/robinebers/openusage) —
> this fork focuses on Windows and Linux. Cross-platform/Win/Linux fixes belong here.

## Philosophy

Tokenmaxxing (like OpenUsage) is highly opinionated: clean design, fast performance, great
UX. The scope is intentionally narrow — tracking AI coding-subscription usage, nothing more.
PRs that expand scope, add unnecessary complexity, or compromise the UX will be closed.
Unsure if your idea fits? [Open an issue](https://github.com/falkoro/tokenmaxxing/issues/new) first.

## Ground Rules

- No feature creep. If it's not about usage tracking, it doesn't belong here.
- Test your changes. UI changes require before/after screenshots.
- Keep it simple. Don't over-engineer.
- One PR per concern. Don't bundle unrelated changes.
- Match the existing design language and code patterns.

## License

By submitting a PR you agree your contribution is licensed under the [MIT License](LICENSE).

## How to contribute

### Fork & PR

1. Fork the repo
2. Branch (`feat/my-change`, `fix/some-bug`)
3. Make your change
4. Run `bun run build` and `bun run test` — both must pass
5. Open a PR against **`master`**

### Add a provider plugin

Each provider is a plugin (see the [Plugin API docs](docs/plugins/api.md)):

1. Create a folder under `plugins/` named for your provider
2. Add `plugin.json` (metadata) and `plugin.js` (implementation)
3. Add docs under `docs/providers/`
4. Test locally with `bun tauri dev`
5. Open a PR with screenshots showing it working

Or [open an issue](https://github.com/falkoro/tokenmaxxing/issues/new) to request a provider.

### Fix a bug

1. Reference the issue number in your PR
2. Describe the root cause and the fix
3. Include before/after screenshots for UI bugs
4. Add a regression test where it fits

### Larger features

Don't open a PR for a large feature without discussing it first —
[open an issue](https://github.com/falkoro/tokenmaxxing/issues/new) and make your case.

## What gets accepted

Bug fixes with clear descriptions · new provider plugins following the Plugin API ·
documentation improvements · performance improvements with benchmarks · accessibility improvements.

## What gets rejected

Scope creep beyond usage tracking · changes that hurt speed/simplicity/UX ·
PRs without testing evidence · code with no clear purpose · cosmetic-only changes without prior discussion.

## Code standards

- TypeScript for the frontend (`src/`), Rust for the backend (`src-tauri/`)
- Follow existing patterns; no new dependencies without justification

## Maintainers & releases

- [@falkoro](https://github.com/falkoro) maintains this fork.
- PRs need **1 maintainer approval** before merging (CI must be green).
- Release tags (`v*`) are owner-managed by [@falkoro](https://github.com/falkoro) and trigger the published Windows/Linux build.

## Questions?

Open an [issue](https://github.com/falkoro/tokenmaxxing/issues/new) using the templates.
