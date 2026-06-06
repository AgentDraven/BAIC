# BOOTSTRAPPING.md

This document outlines the initial setup, bootstrapping, and synchronization process for BAIC repositories using automated tooling.

## 1. Automated Bootstrapping & Sync

Instead of manually running Git initializations, configurations, remote repository creations, and push commands, use the automated enterprise bootstrap script.

To run the bootstrap script, navigate to your local `BAIC` repository root in PowerShell and run:

```powershell
.\scripts\create_baseline_repo.ps1
```

## 2. Interactive Prompts & Defaults

When you run the script, it will guide you through the setup with smart defaults:

1. **Repository Name**: Automatically defaults to your current directory leaf name (e.g., `BAIC`). Press **Enter** to accept, or type a custom name.
2. **Parent Directory**: Defaults to the parent directory of your current workspace (`Split-Path`). Press **Enter** to accept, or specify a custom parent directory path.
3. **Git User Email**: Enter your Git email when prompted. The script automatically configures `user.name` as `AgentDraven` and saves your email in `.env.local` for future runs.
4. **GitHub PAT**: Enter your GitHub Personal Access Token (PAT). This enables automated remote repository creation and pushing. It will be securely stored in `.env.local`.

## 3. Automated Setup Steps Performed

The script automatically executes the following 10 steps safely:

*   **Step 1**: Creates the target repository directory (if it doesn't already exist).
*   **Step 2**: Sets up `.env.local`, `cfg/` folder, and automatically secures `.env.local` inside `.gitignore`.
*   **Step 3 & 4**: Configures local Git `user.name` and `user.email`.
*   **Step 5**: Initializes local Git repository (or safely accommodates existing local Git history).
*   **Step 6**: Copies initial documentation (`BOOTSTRAPPING.md`).
*   **Step 7**: Stages and commits initial baseline files.
*   **Step 8**: Interacts with the GitHub CLI (`gh`) to automatically create the remote repository on GitHub if it doesn't already exist.
*   **Step 9**: Adds or safely updates the Git remote `origin` URL.
*   **Step 10**: Synchronizes and pushes your commits to the remote `main` branch.
*   **Cleanup**: Guarantees your terminal working directory is restored to its original path, even if the script is interrupted or fails.
