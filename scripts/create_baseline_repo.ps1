# create_baseline_repo.ps1

function Create-BaselineRepository {
    param (
        [string]$RepoName = $(Read-Host -Prompt "Enter the name for the new repository (e.g., MyNewProject)"),
        [string]$ParentDirectory = $(Read-Host -Prompt "Enter the full path of the parent directory where the new repository should be created (press Enter for parent of current workspace)" -Default (Split-Path (Get-Location).Path))
    )

    if ([string]::IsNullOrWhiteSpace($RepoName)) {
        Write-Host -ForegroundColor Red "[ERROR] Repository name cannot be empty." -ErrorAction Stop
        return
    }

    if ([string]::IsNullOrWhiteSpace($ParentDirectory)) {
        Write-Host -ForegroundColor Red "[ERROR] Parent directory cannot be empty." -ErrorAction Stop
        return
    }

    $NewRepoPath = Join-Path $ParentDirectory $RepoName
    
    # Check if target path would result in creating a nested repository inside the current project root (C:\Users\balap\AgentDraven\BAIC)
    $CurrentProjectRoot = "C:\Users\balap\AgentDraven\BAIC"
    if ($NewRepoPath.StartsWith($CurrentProjectRoot, [System.StringComparison]::OrdinalIgnoreCase) -and $NewRepoPath -ne $CurrentProjectRoot) {
        Write-Host -ForegroundColor Yellow "`n[WARNING] You are attempting to create the new repository inside the current project root:"
        Write-Host -ForegroundColor Yellow "Target path: $NewRepoPath"
        Write-Host -ForegroundColor Yellow "This will result in an unintentionally nested repository structure (e.g. BAIC\BAIC or BAIC\NewRepo)."
        $ConfirmNested = Read-Host -Prompt "[INPUT REQUIRED] Are you absolutely sure you want to nest this repository? (Y/N)"
        if ($ConfirmNested -ne "Y" -and $ConfirmNested -ne "y") {
            Write-Host -ForegroundColor Red "[ERROR] Operation aborted to prevent recursive/nested repository structure."
            return
        }
    }

    $OriginalPath = (Get-Location).Path

    try {
        Write-Host "`n--- Starting New Repository Bootstrapping ---" -ForegroundColor Blue
        Write-Host "Target Repository Name: $RepoName" -ForegroundColor Blue
        Write-Host "Parent Directory: $ParentDirectory" -ForegroundColor Blue
        Write-Host "Full Path: $NewRepoPath`n" -ForegroundColor Blue

        # Check if the target directory already exists
        if (Test-Path $NewRepoPath) {
            Write-Host -ForegroundColor Yellow "[WARNING] The directory '$NewRepoPath' already exists."
            $ConfirmOverwrite = Read-Host -Prompt "[INPUT REQUIRED] Do you want to overwrite it? (Y/N)"
            if ($ConfirmOverwrite -ne "Y" -and $ConfirmOverwrite -ne "y") {
                Write-Host -ForegroundColor Red "[ERROR] Operation cancelled by user. Exiting."
                return
            }
            Write-Host "[INFO] Overwriting existing directory as confirmed by user." -ForegroundColor DarkCyan
        }

        Write-Host "[STEP 1/10] Creating directory..." -ForegroundColor Cyan
        # Use -Force to overwrite if confirmed, or create if not existing
        New-Item -ItemType Directory -Path $NewRepoPath -Force | Out-Null
        Write-Host "[SUCCESS] Directory created.`n" -ForegroundColor Green

        # Change to the new repository directory for subsequent Git operations
        Set-Location $NewRepoPath
        Write-Host "[INFO] Working directory set to: $NewRepoPath`n" -ForegroundColor DarkCyan

        $EnvFilePath = Join-Path $NewRepoPath ".env.local"
        $CfgPath = Join-Path $NewRepoPath "cfg"
        $GitIgnorePath = Join-Path $NewRepoPath ".gitignore"

        Write-Host "[STEP 2/10] Setting up .env.local, cfg/, and .gitignore..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $CfgPath -Force | Out-Null
        New-Item -ItemType File -Path $EnvFilePath -Force | Out-Null

        # Ensure .gitignore exists
        if (-not (Test-Path $GitIgnorePath)) {
            New-Item -ItemType File -Path $GitIgnorePath -Force | Out-Null
        }
        # Ensure .env.local is in .gitignore
        $GitIgnoreContent = Get-Content $GitIgnorePath -Raw -ErrorAction SilentlyContinue
        if (-not ($GitIgnoreContent -match "^\\s*.env.local\\s*$" -or $GitIgnoreContent -match "^\\s*# .env.local for secrets")) {
            Add-Content -Path $GitIgnorePath -Value "`n# .env.local for secrets`n.env.local"
            Write-Host "[INFO] Ensured .env.local is in .gitignore." -ForegroundColor DarkCyan
        } else {
            Write-Host "[INFO] .env.local is already in .gitignore." -ForegroundColor DarkCyan
        }
        Write-Host "[SUCCESS] .env.local, cfg/, and .gitignore are ready.`n" -ForegroundColor Green

        $EnvVars = @{}
        if (Test-Path $EnvFilePath) {
            $EnvContent = Get-Content $EnvFilePath -Raw -ErrorAction SilentlyContinue
            if ($EnvContent) {
                $EnvContent.Split("`n") | ForEach-Object {
                    if ($_ -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
                        $EnvVars[$matches[1]] = $matches[2]
                    }
                }
            }
        }

        $GitUserName = "AgentDraven"
        Write-Host "[STEP 3/10] Configuring Git user.name..." -ForegroundColor Cyan
        git config user.name "$GitUserName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.name failed." }
        Write-Host "[SUCCESS] Git user.name set to '$GitUserName'.`n" -ForegroundColor Green

        $GitUserEmail = $EnvVars["GIT_USER_EMAIL"]
        if ([string]::IsNullOrWhiteSpace($GitUserEmail)) {
            $GitUserEmail = Read-Host -Prompt "[INPUT REQUIRED] Enter your Git email (will be saved in .env.local)"
            Add-Content -Path $EnvFilePath -Value "`nGIT_USER_EMAIL=$GitUserEmail"
            Write-Host "[INFO] Git email saved to .env.local." -ForegroundColor DarkCyan
        }
        Write-Host "[STEP 4/10] Configuring Git user.email..." -ForegroundColor Cyan
        git config user.email "$GitUserEmail" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.email failed." }
        Write-Host "[SUCCESS] Git user.email set to '$GitUserEmail'.`n" -ForegroundColor Green

        $GitHubToken = $EnvVars["GITHUB_TOKEN"]
        if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
            Write-Host "[NOTICE] GitHub Personal Access Token (PAT) is required for automated remote repository creation and push." -ForegroundColor Yellow
            Write-Host "Please generate one at https://github.com/settings/tokens with 'repo' scope." -ForegroundColor Yellow
            Write-Host "This token will be saved in .env.local. Ensure .env.local is gitignored.`n" -ForegroundColor Yellow
            $GitHubToken = Read-Host -Prompt "[INPUT REQUIRED] Enter your GitHub PAT (visible during entry, saved to .env.local)" # Allow pasting
            Add-Content -Path $EnvFilePath -Value "`nGITHUB_TOKEN=$GitHubToken"
            Write-Host "[INFO] GitHub PAT saved to .env.local." -ForegroundColor DarkCyan
        }
        
        Write-Host "[STEP 5/10] Initializing Git repository locally..." -ForegroundColor Cyan
        git init | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git init failed." }
        Write-Host "[SUCCESS] Git repository initialized locally.`n" -ForegroundColor Green

        $DocsPath = Join-Path $NewRepoPath "docs"
        Write-Host "[STEP 6/10] Creating docs/ and copying BOOTSTRAPPING.md..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null
        Copy-Item -Path "C:\\Users\\balap\\AgentDraven\\BAIC\\docs\\BOOTSTRAPPING.md" -Destination $DocsPath -Force | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Copying BOOTSTRAPPING.md failed." }
        Write-Host "[SUCCESS] BOOTSTRAPPING.md copied to '$DocsPath'.`n" -ForegroundColor Green

        Write-Host "[STEP 7/10] Staging and committing initial files locally..." -ForegroundColor Cyan
        git add . | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git add failed." }
        git commit -m "feat: Initial repository setup with bootstrapping instructions" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }
        Write-Host "[SUCCESS] Initial commit created locally.`n" -ForegroundColor Green
        
        Write-Host "[STEP 8/10] Checking for GitHub CLI (gh) and creating remote repository..." -ForegroundColor Cyan
        $ghResult = (gh --version 2>&1)
        if ($LASTEXITCODE -ne 0) {
            Write-Host -ForegroundColor Red "[ERROR] GitHub CLI (gh) not found or not configured. Please install and authenticate gh CLI. Refer to https://cli.github.com/ for installation and 'gh auth login' for authentication." -ErrorAction Stop
            return
        }
        Write-Host "[INFO] GitHub CLI (gh) found." -ForegroundColor DarkCyan

        # Create remote repository on GitHub
        $createRepoResult = gh repo create "${GitUserName}/${RepoName}" --public --source=. --description "Initial repository for ${RepoName}" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host -ForegroundColor Red "[ERROR] Failed to create remote GitHub repository: $($createRepoResult -join "`n"). This might be due to a duplicate repository name, insufficient permissions, or gh CLI authentication issues. Please check the error." -ErrorAction Stop
            return
        }
        Write-Host "[SUCCESS] Remote GitHub repository '${GitUserName}/${RepoName}' created.`n" -ForegroundColor Green

        $RemoteUrl = "https://github.com/${GitUserName}/${RepoName}.git"
        Write-Host "[STEP 9/10] Adding remote origin..." -ForegroundColor Cyan
        git remote add origin $RemoteUrl | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git remote add origin failed." }
        Write-Host "[SUCCESS] Remote origin added: $RemoteUrl`n" -ForegroundColor Green

        Write-Host "[STEP 10/10] Pushing initial commit to remote..." -ForegroundColor Cyan
        git branch -M main | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git branch -M main failed." }
        
        Write-Host "[INFO] Attempting push..." -ForegroundColor DarkCyan
        $pushResult = git push -u origin main 2>&1
        if ($LASTEXITCODE -ne 0) { 
            Write-Host -ForegroundColor Red "[ERROR] Git push failed: $($pushResult -join "`n"). Please check the output above for details." -ErrorAction Stop
            return
        }

        Write-Host "[SUCCESS] Pushed initial commit to remote.`n" -ForegroundColor Green

        Write-Host "--- Repository '$RepoName' created, bootstrapped, and pushed successfully! ---`n" -ForegroundColor Green
        Write-Host "You can access your new repository on GitHub at: https://github.com/${GitUserName}/${RepoName}" -ForegroundColor Green
        Write-Host "Local path: $NewRepoPath" -ForegroundColor Green
        Write-Host "Ensure '.env.local' is kept secure and not committed to version control." -ForegroundColor Yellow
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed during bootstrapping: $($_.Exception.Message)" -ErrorAction Stop
    } finally {
        # RESTORE the directory, guaranteed!
        Set-Location $OriginalPath
        Write-Host "[INFO] Restored directory back to original path: $OriginalPath" -ForegroundColor DarkCyan
    }
}

Create-BaselineRepository