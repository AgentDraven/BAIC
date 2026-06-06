# CHANGELOG

## [0.0.11] - 2026-06-05

### ✨ Updated
- Replaced dark blue console text with a highly visible `Magenta` color scheme for headers.
- Implemented interactive, context-aware `.gitignore` and `.env.local` security checks to prompt the operator and automatically secure secrets rather than outputting redundant post-run messages.
- Completely rewrote `docs/BOOTSTRAPPING.md` to document the automated PowerShell bootstrapping process instead of the laborious manual git commands.

## [0.0.10] - 2026-06-05

### ✨ Updated
- Added a robust `try-finally` directory restoration wrapper in `scripts/create_baseline_repo.ps1` to guarantee the operator's terminal returns to its original directory even on abort, error, or completion.
- Set default parent directory for new repositories to the parent of the current workspace (`Split-Path`) to prevent accidental nested folders.
- Implemented proactive warning checks to block creating a nested repository inside the current project root unless explicitly authorized by the operator.

## [0.0.9] - 2026-06-05

### ✨ Updated
- Integrated GitHub CLI (`gh repo create`) to automatically create remote repositories before pushing.
- Set default parent directory for new repositories to the current working directory, improving usability.
- Ensured `.env.local` is always added to `.gitignore` without conditional warnings.

## [0.0.8] - 2026-06-05

### ✨ Updated
- Significantly improved `scripts/create_baseline_repo.ps1` usability:
    - Implemented verbose, colored output (Green for success, Blue for info, Yellow for warnings, Red for errors).
    - Enabled pasting for GitHub Personal Access Token (PAT) input.
    - Ensured `GIT_USER_EMAIL` and `GITHUB_TOKEN` are correctly saved to `.env.local`.

## [0.0.7] - 2026-06-05

### 🐛 Fixed
- Resolved PowerShell parsing error due to incorrect parenthesis in `scripts/create_baseline_repo.ps1`.

## [0.0.6] - 2026-06-05

### ✨ Updated
- Added verbose output and clear status messages to `scripts/create_baseline_repo.ps1` for better user feedback.

## [0.0.5] - 2026-06-05

### 🐛 Fixed
- Implemented robust error handling with `try-catch` and `$LASTEXITCODE` checks in `scripts/create_baseline_repo.ps1`.
- Removed `ConvertTo-Plaintext` and improved secure handling of GitHub PAT, with clear instructions for `.env.local`.
- Corrected GitHub remote URL construction for PAT-based authentication.
- Ensured `.env.local` is added to `.gitignore` during repository creation.

## [0.0.4] - 2026-06-05

### 🐛 Fixed
- Resolved PowerShell variable interpolation error in `scripts/create_baseline_repo.ps1` for remote URL construction.

## [0.0.3] - 2026-06-05

### ✨ Updated
- Automated Git user configuration, remote setup, and push in `scripts/create_baseline_repo.ps1`.
- Integrated saving sensitive information (Git email, GitHub token/password) to `.env.local`.

## [0.0.2] - 2026-06-05

### ✨ Added
- Added `scripts/create_baseline_repo.ps1` to facilitate new repository bootstrapping.

## [0.0.1] - 2026-06-05

### ✨ Added
- Initial project structure based on MERIT.instructions and AgentDraven.instructions.
- `docs/input/BAIC_PRD.md` with PRD, HLD, and LLD content, including inline rationale comments and a bibliography.
- `docs/BAIC_theme.md` with theme content and bibliography.
- `cfg/theme.md` created as a placeholder for brand strategy configuration.
- Updated `C:\Users\balap\AgentDraven\AgentDraven.instructions` to include documentation standards.

### 🔧 Technical Changes
- Corrected `dirt` project directory location to be a sibling of `BAIC`.
- Moved DIRT-specific instructions from `AgentDraven.instructions` to `C:\Users\balap\AgentDraven\dirt\DIRT.instructions`.

### ✨ Updated
- Significantly improved `scripts/create_baseline_repo.ps1` usability:
    - Implemented verbose, colored output (Green for success, Blue for info, Yellow for warnings, Red for errors).
    - Enabled pasting for GitHub Personal Access Token (PAT) input.
    - Ensured `GIT_USER_EMAIL` and `GITHUB_TOKEN` are correctly saved to `.env.local`.

## [0.0.7] - 2026-06-05

### 🐛 Fixed
- Resolved PowerShell parsing error due to incorrect parenthesis in `scripts/create_baseline_repo.ps1`.

## [0.0.6] - 2026-06-05

### ✨ Updated
- Added verbose output and clear status messages to `scripts/create_baseline_repo.ps1` for better user feedback.

## [0.0.5] - 2026-06-05

### 🐛 Fixed
- Implemented robust error handling with `try-catch` and `$LASTEXITCODE` checks in `scripts/create_baseline_repo.ps1`.
- Removed `ConvertTo-Plaintext` and improved secure handling of GitHub PAT, with clear instructions for `.env.local`.
- Corrected GitHub remote URL construction for PAT-based authentication.
- Ensured `.env.local` is added to `.gitignore` during repository creation.

## [0.0.4] - 2026-06-05

### 🐛 Fixed
- Resolved PowerShell variable interpolation error in `scripts/create_baseline_repo.ps1` for remote URL construction.

## [0.0.3] - 2026-06-05

### ✨ Updated
- Automated Git user configuration, remote setup, and push in `scripts/create_baseline_repo.ps1`.
- Integrated saving sensitive information (Git email, GitHub token/password) to `.env.local`.

## [0.0.2] - 2026-06-05

### ✨ Added
- Added `scripts/create_baseline_repo.ps1` to facilitate new repository bootstrapping.

## [0.0.1] - 2026-06-05

### ✨ Added
- Initial project structure based on MERIT.instructions and AgentDraven.instructions.
- `docs/input/BAIC_PRD.md` with PRD, HLD, and LLD content, including inline rationale comments and a bibliography.
- `docs/BAIC_theme.md` with theme content and bibliography.
- `cfg/theme.md` created as a placeholder for brand strategy configuration.
- Updated `C:\Users\balap\AgentDraven\AgentDraven.instructions` to include documentation standards.

### 🔧 Technical Changes
- Corrected `dirt` project directory location to be a sibling of `BAIC`.
- Moved DIRT-specific instructions from `AgentDraven.instructions` to `C:\Users\balap\AgentDraven\dirt\DIRT.instructions`.