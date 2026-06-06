# create_baseline_repo.ps1

function Create-BaselineRepository {
    param (
        [string]$RepoName = $(Read-Host -Prompt "Enter the name for the new repository (e.g., MyNewProject)")
    )

    if ([string]::IsNullOrWhiteSpace($RepoName)) {
        Write-Host -ForegroundColor Red "[ERROR] Repository name cannot be empty." -ErrorAction Stop
        return
    }

    $NewRepoPath = Join-Path (Get-Location).Path $RepoName
    
    Write-Host "`n--- Starting New Repository Bootstrapping ---" -ForegroundColor Blue
    Write-Host "Target: $RepoName (Path: $NewRepoPath)`n" -ForegroundColor Blue

    try {
        Write-Host "[STEP 1/9] Creating directory..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $NewRepoPath -Force | Out-Null
        Write-Host "[SUCCESS] Directory created.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to create directory: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    Set-Location $NewRepoPath
    Write-Host "[INFO] Working directory set to: $NewRepoPath`n" -ForegroundColor DarkCyan

    $EnvFilePath = Join-Path $NewRepoPath ".env.local"
    $CfgPath = Join-Path $NewRepoPath "cfg"
    $GitIgnorePath = Join-Path $NewRepoPath ".gitignore"

    try {
        Write-Host "[STEP 2/9] Setting up .env.local and cfg/..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $CfgPath -Force | Out-Null
        New-Item -ItemType File -Path $EnvFilePath -Force | Out-Null

        # Add .env.local to .gitignore if not present
        if (-not (Test-Path $GitIgnorePath)) {
            New-Item -ItemType File -Path $GitIgnorePath -Force | Out-Null
        }
        $GitIgnoreContent = Get-Content $GitIgnorePath -Raw -ErrorAction SilentlyContinue
        if (-not ($GitIgnoreContent -match "^\\s*.env.local\\s*$" -or $GitIgnoreContent -match "^\\s*# .env.local for secrets")) {
            Add-Content -Path $GitIgnorePath -Value "`n# .env.local for secrets`n.env.local"
            Write-Host "[INFO] Added .env.local to .gitignore." -ForegroundColor DarkCyan
        }
        Write-Host "[SUCCESS] .env.local and cfg/ are ready.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to set up .env.local or cfg/: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $EnvVars = @{}
    if (Test-Path $EnvFilePath) {
        try {
            $EnvContent = Get-Content $EnvFilePath -Raw -ErrorAction SilentlyContinue
            if ($EnvContent) {
                $EnvContent.Split("`n") | ForEach-Object {
                    if ($_ -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
                        $EnvVars[$matches[1]] = $matches[2]
                    }
                }
            }
        } catch {
            Write-Host -ForegroundColor Yellow "[WARNING] Could not read existing .env.local: $($_.Exception.Message)"
        }
    }

    $GitUserName = "AgentDraven"
    try {
        Write-Host "[STEP 3/9] Configuring Git user.name..." -ForegroundColor Cyan
        git config user.name "$GitUserName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.name failed." }
        Write-Host "[SUCCESS] Git user.name set to '$GitUserName'.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to configure Git user.name: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $GitUserEmail = $EnvVars["GIT_USER_EMAIL"]
    if ([string]::IsNullOrWhiteSpace($GitUserEmail)) {
        $GitUserEmail = Read-Host -Prompt "[INPUT REQUIRED] Enter your Git email (will be saved in .env.local)"
        Add-Content -Path $EnvFilePath -Value "`nGIT_USER_EMAIL=$GitUserEmail"
        Write-Host "[INFO] Git email saved to .env.local." -ForegroundColor DarkCyan
    }
    try {
        Write-Host "[STEP 4/9] Configuring Git user.email..." -ForegroundColor Cyan
        git config user.email "$GitUserEmail" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.email failed." }
        Write-Host "[SUCCESS] Git user.email set to '$GitUserEmail'.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to configure Git user.email: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $GitHubToken = $EnvVars["GITHUB_TOKEN"]
    if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
        Write-Host "[NOTICE] GitHub Personal Access Token (PAT) is required for automated push." -ForegroundColor Yellow
        Write-Host "Please generate one at https://github.com/settings/tokens with 'repo' scope." -ForegroundColor Yellow
        Write-Host "This token will be saved in .env.local. Ensure .env.local is gitignored.`n" -ForegroundColor Yellow
        $GitHubToken = Read-Host -Prompt "[INPUT REQUIRED] Enter your GitHub PAT (visible during entry, saved to .env.local)" # Allow pasting
        Add-Content -Path $EnvFilePath -Value "`nGITHUB_TOKEN=$GitHubToken"
        Write-Host "[INFO] GitHub PAT saved to .env.local." -ForegroundColor DarkCyan
    }
    
    try {
        Write-Host "[STEP 5/9] Initializing Git repository..." -ForegroundColor Cyan
        git init | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git init failed." }
        Write-Host "[SUCCESS] Git repository initialized.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to initialize Git repository: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $DocsPath = Join-Path $NewRepoPath "docs"
    try {
        Write-Host "[STEP 6/9] Creating docs/ and copying BOOTSTRAPPING.md..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null
        Copy-Item -Path "C:\\Users\\balap\\AgentDraven\\BAIC\\docs\\BOOTSTRAPPING.md" -Destination $DocsPath -Force | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Copying BOOTSTRAPPING.md failed." }
        Write-Host "[SUCCESS] BOOTSTRAPPING.md copied to '$DocsPath'.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to copy BOOTSTRAPPING.md: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $RemoteUrl = "https://github.com/${GitUserName}/${RepoName}.git"
    try {
        Write-Host "[STEP 7/9] Adding remote repository..." -ForegroundColor Cyan
        git remote add origin $RemoteUrl | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git remote add origin failed." }
        Write-Host "[SUCCESS] Remote added: $RemoteUrl`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to add remote: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    try {
        Write-Host "[STEP 8/9] Staging and committing initial files..." -ForegroundColor Cyan
        git add . | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git add failed." }
        git commit -m "feat: Initial repository setup with bootstrapping instructions" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }
        Write-Host "[SUCCESS] Initial commit created.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to create initial commit: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    try {
        Write-Host "[STEP 9/9] Pushing initial commit to remote..." -ForegroundColor Cyan
        git branch -M main | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git branch -M main failed." }
        
        # Use $GitHubToken directly for push. Git will use credential helper or prompt if needed.
        # If $GitHubToken is provided here, it will be used as a password (less secure, but works for automation)
        $pushCommand = "git push -u origin main"
        if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) {
             Write-Host "[INFO] Attempting push with provided GitHub PAT..." -ForegroundColor DarkCyan
             # For automated PAT push, Git expects it via stdin or credential helper. This is a common workaround.
             # For proper secure automation, a credential helper should be configured.
             # Using a simple `git push` often triggers the credential manager on Windows.
             $pushResult = git push -u origin main # This should ideally use a credential helper.
        } else {
            Write-Host "[INFO] No GitHub PAT provided in .env.local. Attempting push. You may be prompted for credentials..." -ForegroundColor DarkCyan
            $pushResult = git push -u origin main
        }

        if ($LASTEXITCODE -ne 0) { 
            Write-Host -ForegroundColor Red "[ERROR] Git push failed. This might be due to incorrect PAT, insufficient permissions, or repository not existing on GitHub. Please check output above for details." -ErrorAction Stop
            Write-Host -ForegroundColor Red "Full push output: `$($pushResult -join "`n`")"
            return
        }

        Write-Host "[SUCCESS] Pushed initial commit to remote.`n" -ForegroundColor Green
    } catch {
        Write-Host -ForegroundColor Red "[ERROR] Failed to push to remote: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    Write-Host "--- Repository '$RepoName' created and bootstrapped successfully! ---" -ForegroundColor Green
    Write-Host "You can find your new repository at: $NewRepoPath" -ForegroundColor Green
    Write-Host "Ensure '.env.local' is kept secure and not committed to version control." -ForegroundColor Yellow

    Set-Location C:\\Users\\balap\\AgentDraven\\BAIC
}

Create-BaselineRepository