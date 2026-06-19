# CHANGELOG














## [0.8.18] - 2026-06-19

### Changed
- IAR MERITUTILS_WORKBENCH: Phase 0 **ACK with feedback** for `@meritutils/merit_workbench`; capability opt-out table; BAI-MWB-V* IDs.

## [0.8.17] - 2026-06-19

### Changed
- Patch closeout (mXin)
## [0.8.16] - 2026-06-08

### Added
- IAR handoffs: MERITUTILS_WORKBENCH.md (BAI-MTU-* for merit_workbench) and MERITUTILS_ENV.md (layered env).
- Design/usage SSOT: llm_api, merit_env chain, HND plan in baic_design.md and baic_usage.md.

### Changed
- BAIC docs/INDEX.md IAR section per MERIT section 0.D.

## [0.8.15] - 2026-06-14

### Changed
- chore: repo_hygiene_check shim, AGENTS L3 pointer, remove empty cfg/theme.md
## [0.8.14] - 2026-06-13

### Changed
- fix: MERIT hyperlink format on baic_usage
## [0.8.13] - 2026-06-13

### Changed
- fix: baic doc links to archived SSOT paths
## [0.8.12] - 2026-06-13

### Changed
- chore(wave-6): refresh INDEX cert visibility block
## [0.8.11] - 2026-06-13

### Changed
- feat(wave-6): baic 3-doc SSOT rename
## [0.8.10] - 2026-06-13

### Changed
- chore(wave-0): gitignore hygiene patch closeout
## [0.8.9] - 2026-06-13

### Changed
- chore: refresh INDEX after MERIT-8.8 baseline
## [0.8.8] - 2026-06-13

### Added
- release: MERIT x.8.8 baseline (0.8.8)
## [0.2.2] - 2026-06-13

### Changed
- chore: refresh INDEX cert visibility block
## [0.2.1] - 2026-06-12

### Changed
- chore: add vault compliance shims
## [0.2.0] - 2026-06-12

### Added
- baseline: MERIT structure streamlined
## [0.1.10] - 2026-06-12

### Changed
- chore: MERIT baseline compliance (L1 pointer, README, .env.example)
## [0.1.9] - 2026-06-08

### Added
- **Four `llm_api` providers** from dirt SSOT: `groq`, `openai`, `gemini`, `anthropic` in `cfg/provider_registry.json` with `byok` hierarchy and hub cards.
- **Shared LLM API bridge** (`bridge/llm_api.py`) plus thin stubs under `bridge/{groq,openai,gemini,anthropic}/`.
- **`LLM_API_CONSOLE`** spoke template in `cfg/spoke_console_layout.json`.
- **Model capability matrix v1.1.0** â€” dirt model IDs wired to new `llm_api` platforms.
- **Layered env merge** â€” `core/merit_env.py` and `load_merged_provider_secrets()` in `core/config_loader.py` (L2 persona â†’ L3 repo precedence).
- **Secrets scaffold** â€” `GROQ_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` in `.env.local.example` and `cfg/secrets.example.json`.

### Changed
- `core/api/app.py` loads merged provider secrets at startup.
- **40 pytest tests** (added `test_llm_api_bridge_loads`).

## [0.1.6] - 2026-06-06

### Added (Phases 2â€“5)
- **PÃ—M matrix:** `cfg/model_capability_matrix.json`, `/api/v1/capability/*`, Hub family chips, Spoke Block C UI.
- **`--stub` / `--validate-config`:** MERIT Â§II.G strict stub mode; demo seed only with `--stub`.
- **Config scaffold:** `cfg/secrets.example.json`, `.env.local.example`, `core/config_scaffold.py` validator.
- **MERIT X-Ray:** `/api/v1/xray/runtime`, `/api/v1/xray/event`, HTTP middleware logging, `XRayTerminal` UI.
- **Mobile-First shell:** hot-dot non-blocking overlays + desktop 3-rail `lg+`; `ConfigRail`.
- **`BAIC.instructions` L3** at repo root.
- **37 pytest tests** (stub, matrix, scaffold, x-ray).

### Changed
- Live mode fails closed without credentials; hub KPIs from `cfg/config.json` `hub` section.
- Integration tests use `--stub` semantics via test fixtures.

## [0.1.2] - 2026-06-06

### Changed
- Renamed `docs/` â†’ **`BAIC docs/`** per MERIT `{Name} docs/` convention (Obsidian-unique vault folders).
- Updated README, AGENTS.md, bridge README, and all internal doc cross-links.
- Documented **lint-before-test** closeout hygiene in AGENTS.md and `BAIC docs/BOOTSTRAPPING.md` Â§6.
- `merit.ps1` scaffold README and bootstrap template path prefer branded docs folder.

## [0.1.1] - 2026-06-05

### Added
- **Control plane Alpha:** FastAPI backend, modular SQLite (`db/DatabasePort`), eNAT schema + seed data.
- **Seven provider bridges:** `bridge/google`, `azure`, `aws`, `oci`, `cursor`, `github_copilot`, `google_one`.
- **React UI:** Global Ledger Hub + Google Spoke with Recharts cost gauge (`web/`).
- **Entry points:** `run_baic.py`, `test_baic.py` â€” 22 pytest tests (unit + integration).
- **Docs:** `INDEX`, `USER_GUIDE`, `TECHNICAL_HLD_LLD`, `CONCEPTS_GUIDE`, `COMPLETION_REPORT`, `AGENTS.md`.
- **Cfg SSOT:** `cfg/config.json`, `cfg/provider_registry.json`.

### Changed
- `merit.ps1 mXin` tags and pushes by default (MERIT Â§VIII.F closeout).

## [0.1.0] - 2026-06-05

### Added
- baseline: Bootstrap and initial setup in prestine condition

## [0.0.14] - 2026-06-05

### Changed
- Consolidated **7 scripts into 1**: `scripts/merit.ps1` with actions `bootstrap`, `mXout`, `mXin`, `help`.
- Removed `merit_bootstrap.ps1`, `mXin.ps1`, `mXout.ps1`, `merit_git_common.ps1`, `merit_mxin_mxout.ps1`, and deprecated aliases.
- Updated `README.md`, `docs/BOOTSTRAPPING.md`, and MERIT Â§XI.D to document the single-script workflow.

## [0.0.13] - 2026-06-05

### Added
- **`scripts/mXin.ps1`** â€” check-in: commit, push to remote, release exclusive locks.
- **`scripts/mXout.ps1`** â€” check-out: lock file/directory (recursive on tracked files), pull from remote.
- **`ops/locks/`** â€” collaborative lock registry pushed to git so others cannot mXout overlapping paths.
- **`scripts/merit_mxin_mxout.ps1`** â€” shared mXin/mXout implementation.

### Updated
- `docs/BOOTSTRAPPING.md` â€” full mXout/mXin flow, parameters, quick-reference table.
- `README.md` â€” operator script index and documentation table.
- MERIT Â§XI.D â€” documents mXin/mXout instead of merit_xin_xout.ps1.
- `merit_xin_xout.ps1` â€” deprecated alias forwarding to mXin/mXout.

## [0.0.12] - 2026-06-05

### âœ¨ Added
- **`scripts/merit_bootstrap.ps1`** â€” canonical MERIT first-time bootstrap (replaces `create_baseline_repo.ps1` as primary entry).
- **`scripts/merit_xin_xout.ps1`** â€” Xin (check-in) and XOut (check-out) closeout with ya/na/ay/an per-file staging.
- **`scripts/merit_git_common.ps1`** â€” shared preflight, confirmation, and git helpers.
- MERIT Â§I.A.1 pre-bootstrap checklist, Â§II.D.1 YA/NA/AY/AN codes, Â§XI.D lifecycle scripts in vault `MERIT.instructions`.

### âœ¨ Updated
- `docs/BOOTSTRAPPING.md` â€” documents pre-bootstrap expectations, Option B (Xin/XOut), and verify-only mode.
- `create_baseline_repo.ps1` â€” deprecated alias forwarding to `merit_bootstrap.ps1`.

## [0.0.11] - 2026-06-05

### âœ¨ Updated
- Replaced dark blue console text with a highly visible `Magenta` color scheme for headers.
- Implemented interactive, context-aware `.gitignore` and `.env.local` security checks to prompt the operator and automatically secure secrets rather than outputting redundant post-run messages.
- Completely rewrote `docs/BOOTSTRAPPING.md` to document the automated PowerShell bootstrapping process instead of the laborious manual git commands.

## [0.0.10] - 2026-06-05

### âœ¨ Updated
- Added a robust `try-finally` directory restoration wrapper in `scripts/create_baseline_repo.ps1` to guarantee the operator's terminal returns to its original directory even on abort, error, or completion.
- Set default parent directory for new repositories to the parent of the current workspace (`Split-Path`) to prevent accidental nested folders.
- Implemented proactive warning checks to block creating a nested repository inside the current project root unless explicitly authorized by the operator.

## [0.0.9] - 2026-06-05

### âœ¨ Updated
- Integrated GitHub CLI (`gh repo create`) to automatically create remote repositories before pushing.
- Set default parent directory for new repositories to the current working directory, improving usability.
- Ensured `.env.local` is always added to `.gitignore` without conditional warnings.

## [0.0.8] - 2026-06-05

### âœ¨ Updated
- Significantly improved `scripts/create_baseline_repo.ps1` usability:
    - Implemented verbose, colored output (Green for success, Blue for info, Yellow for warnings, Red for errors).
    - Enabled pasting for GitHub Personal Access Token (PAT) input.
    - Ensured `GIT_USER_EMAIL` and `GITHUB_TOKEN` are correctly saved to `.env.local`.

## [0.0.7] - 2026-06-05

### ðŸ› Fixed
- Resolved PowerShell parsing error due to incorrect parenthesis in `scripts/create_baseline_repo.ps1`.

## [0.0.6] - 2026-06-05

### âœ¨ Updated
- Added verbose output and clear status messages to `scripts/create_baseline_repo.ps1` for better user feedback.

## [0.0.5] - 2026-06-05

### ðŸ› Fixed
- Implemented robust error handling with `try-catch` and `$LASTEXITCODE` checks in `scripts/create_baseline_repo.ps1`.
- Removed `ConvertTo-Plaintext` and improved secure handling of GitHub PAT, with clear instructions for `.env.local`.
- Corrected GitHub remote URL construction for PAT-based authentication.
- Ensured `.env.local` is added to `.gitignore` during repository creation.

## [0.0.4] - 2026-06-05

### ðŸ› Fixed
- Resolved PowerShell variable interpolation error in `scripts/create_baseline_repo.ps1` for remote URL construction.

## [0.0.3] - 2026-06-05

### âœ¨ Updated
- Automated Git user configuration, remote setup, and push in `scripts/create_baseline_repo.ps1`.
- Integrated saving sensitive information (Git email, GitHub token/password) to `.env.local`.

## [0.0.2] - 2026-06-05

### âœ¨ Added
- Added `scripts/create_baseline_repo.ps1` to facilitate new repository bootstrapping.

## [0.0.1] - 2026-06-05

### âœ¨ Added
- Initial project structure based on MERIT.instructions and AgentDraven.instructions.
- `docs/input/BAIC_PRD.md` with PRD, HLD, and LLD content, including inline rationale comments and a bibliography.
- `docs/BAIC_theme.md` with theme content and bibliography.
- `cfg/theme.md` created as a placeholder for brand strategy configuration.
- Updated `C:\Users\balap\AgentDraven\AgentDraven.instructions` to include documentation standards.

### ðŸ”§ Technical Changes
- Corrected `dirt` project directory location to be a sibling of `BAIC`.
- Moved DIRT-specific instructions from `AgentDraven.instructions` to `C:\Users\balap\AgentDraven\dirt\DIRT.instructions`.

### âœ¨ Updated
- Significantly improved `scripts/create_baseline_repo.ps1` usability:
    - Implemented verbose, colored output (Green for success, Blue for info, Yellow for warnings, Red for errors).
    - Enabled pasting for GitHub Personal Access Token (PAT) input.
    - Ensured `GIT_USER_EMAIL` and `GITHUB_TOKEN` are correctly saved to `.env.local`.

## [0.0.7] - 2026-06-05

### ðŸ› Fixed
- Resolved PowerShell parsing error due to incorrect parenthesis in `scripts/create_baseline_repo.ps1`.

## [0.0.6] - 2026-06-05

### âœ¨ Updated
- Added verbose output and clear status messages to `scripts/create_baseline_repo.ps1` for better user feedback.

## [0.0.5] - 2026-06-05

### ðŸ› Fixed
- Implemented robust error handling with `try-catch` and `$LASTEXITCODE` checks in `scripts/create_baseline_repo.ps1`.
- Removed `ConvertTo-Plaintext` and improved secure handling of GitHub PAT, with clear instructions for `.env.local`.
- Corrected GitHub remote URL construction for PAT-based authentication.
- Ensured `.env.local` is added to `.gitignore` during repository creation.

## [0.0.4] - 2026-06-05

### ðŸ› Fixed
- Resolved PowerShell variable interpolation error in `scripts/create_baseline_repo.ps1` for remote URL construction.

## [0.0.3] - 2026-06-05

### âœ¨ Updated
- Automated Git user configuration, remote setup, and push in `scripts/create_baseline_repo.ps1`.
- Integrated saving sensitive information (Git email, GitHub token/password) to `.env.local`.

## [0.0.2] - 2026-06-05

### âœ¨ Added
- Added `scripts/create_baseline_repo.ps1` to facilitate new repository bootstrapping.

## [0.0.1] - 2026-06-05

### âœ¨ Added
- Initial project structure based on MERIT.instructions and AgentDraven.instructions.
- `docs/input/BAIC_PRD.md` with PRD, HLD, and LLD content, including inline rationale comments and a bibliography.
- `docs/BAIC_theme.md` with theme content and bibliography.
- `cfg/theme.md` created as a placeholder for brand strategy configuration.
- Updated `C:\Users\balap\AgentDraven\AgentDraven.instructions` to include documentation standards.

### ðŸ”§ Technical Changes
- Corrected `dirt` project directory location to be a sibling of `BAIC`.
- Moved DIRT-specific instructions from `AgentDraven.instructions` to `C:\Users\balap\AgentDraven\dirt\DIRT.instructions`.

