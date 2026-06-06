# create_baseline_repo.ps1

function Create-BaselineRepository {
    param (
        [string]$RepoName = $(Read-Host "Enter the name for the new repository (e.g., MyNewProject)")
    )

    if ([string]::IsNullOrWhiteSpace($RepoName)) {
        Write-Error "Repository name cannot be empty." -ErrorAction Stop
        return
    }

    $NewRepoPath = Join-Path (Get-Location).Path $RepoName
    
    Write-Host "\n--- Starting New Repository Bootstrapping ---"
    Write-Host "Target Repository Name: $RepoName"
    Write-Host "Full Path: $NewRepoPath\n"

    try {
        Write-Host "[STEP 1/9] Creating new repository directory..."
        New-Item -ItemType Directory -Path $NewRepoPath -Force | Out-Null
        Write-Host "[SUCCESS] Directory created: $NewRepoPath"
    } catch {
        Write-Error "[ERROR] Failed to create new repository directory: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    Set-Location $NewRepoPath
    Write-Host "[INFO] Current working directory set to: $NewRepoPath\n"

    $EnvFilePath = Join-Path $NewRepoPath ".env.local"
    $CfgPath = Join-Path $NewRepoPath "cfg"
    try {
        Write-Host "[STEP 2/9] Setting up .env.local and cfg directory..."
        New-Item -ItemType Directory -Path $CfgPath -Force | Out-Null
        New-Item -ItemType File -Path $EnvFilePath -Force | Out-Null
        if (-not (Get-Content (Join-Path $NewRepoPath ".gitignore") -Raw -ErrorAction SilentlyContinue) -match ".env.local")) {
            Add-Content -Path (Join-Path $NewRepoPath ".gitignore") -Value ".env.local"
            Write-Host "[INFO] Added .env.local to .gitignore."
        }
        Write-Host "[SUCCESS] .env.local and cfg directory are ready."
    } catch {
        Write-Error "[ERROR] Failed to set up .env.local or cfg directory: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $EnvVars = @{}
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
        Write-Warning "[WARNING] Could not read .env.local: $($_.Exception.Message)"
    }

    $GitUserName = "AgentDraven"
    try {
        Write-Host "\n[STEP 3/9] Configuring Git user.name..."
        git config user.name "$GitUserName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.name failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Git user.name configured as '$GitUserName'."
    } catch {
        Write-Error "[ERROR] Failed to configure Git user.name: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $GitUserEmail = $EnvVars["GIT_USER_EMAIL"]
    if ([string]::IsNullOrWhiteSpace($GitUserEmail)) {
        $GitUserEmail = Read-Host "[INPUT REQUIRED] Enter your Git email address (will be saved in .env.local if you wish)"
        Add-Content -Path $EnvFilePath -Value "GIT_USER_EMAIL=$GitUserEmail"
        Write-Host "[INFO] Git email saved to .env.local."
    }
    try {
        Write-Host "[STEP 4/9] Configuring Git user.email..."
        git config user.email "$GitUserEmail" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.email failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Git user.email configured as '$GitUserEmail'."
    } catch {
        Write-Error "[ERROR] Failed to configure Git user.email: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $GitHubToken = $EnvVars["GITHUB_TOKEN"]
    if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
        Write-Host "\n[NOTICE] GitHub Personal Access Token (PAT) is required for automated push."
        Write-Host "Please generate one at https://github.com/settings/tokens with 'repo' scope."
        Write-Host "Add it manually to the .env.local file in the new repository as GITHUB_TOKEN=YOUR_PAT."
        Write-Host "Alternatively, you can enter it now, but it will only be used for this session and NOT saved in plaintext.\n"
        $SecureToken = Read-Host -AsSecureString "[INPUT REQUIRED] Enter your GitHub PAT (not saved to .env.local in plaintext)"
        $GitHubToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken))
        
        if (-not $EnvContent -match "^\s*GITHUB_TOKEN=") {
            Add-Content -Path $EnvFilePath -Value "GITHUB_TOKEN=YOUR_GITHUB_PERSONAL_ACCESS_TOKEN_HERE"
            Write-Host "[INFO] A placeholder for GITHUB_TOKEN has been added to .env.local. Please update it manually for future runs."
        }
    }
    
    try {
        Write-Host "\n[STEP 5/9] Initializing Git repository..."
        git init | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git init failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Git repository initialized."
    } catch {
        Write-Error "[ERROR] Failed to initialize Git repository: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $DocsPath = Join-Path $NewRepoPath "docs"
    try {
        Write-Host "\n[STEP 6/9] Creating docs directory and copying BOOTSTRAPPING.md..."
        New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null
        Copy-Item -Path "C:\\Users\\balap\\AgentDraven\\BAIC\\docs\\BOOTSTRAPPING.md" -Destination $DocsPath -Force | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Copying BOOTSTRAPPING.md failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Copied BOOTSTRAPPING.md to '$DocsPath'."
    } catch {
        Write-Error "[ERROR] Failed to copy BOOTSTRAPPING.md: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    $RemoteUrl = "https://github.com/${GitUserName}/${RepoName}.git"
    try {
        Write-Host "\n[STEP 7/9] Adding remote repository..."
        git remote add origin $RemoteUrl | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git remote add origin failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Added remote repository: $RemoteUrl"
    } catch {
        Write-Error "[ERROR] Failed to add remote repository: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    try {
        Write-Host "\n[STEP 8/9] Staging and committing initial files..."
        git add . | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git add failed with exit code $LASTEXITCODE." }
        git commit -m "feat: Initial repository setup with bootstrapping instructions" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git commit failed with exit code $LASTEXITCODE." }
        Write-Host "[SUCCESS] Initial commit created."
    } catch {
        Write-Error "[ERROR] Failed to create initial commit: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    try {
        Write-Host "\n[STEP 9/9] Pushing initial commit to remote..."
        git branch -M main | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git branch -M main failed with exit code $LASTEXITCODE." }
        
        if (-not [string]::IsNullOrWhiteSpace($GitHubToken)) {
            Write-Host "[INFO] Attempting to push using the provided GitHub PAT..."
            $pushResult = git push -u origin main 2>&1
            if ($LASTEXITCODE -ne 0) { 
                Write-Error "[ERROR] Git push failed: $($pushResult -join "`n"). This might be due to incorrect PAT, insufficient permissions, or repository not existing on GitHub. Please check the error message above." -ErrorAction Stop
                return
            }
        } else {
            Write-Host "[INFO] No GitHub PAT provided. Attempting to push. You may be prompted for credentials."
            $pushResult = git push -u origin main 2>&1
            if ($LASTEXITCODE -ne 0) { 
                Write-Error "[ERROR] Git push failed: $($pushResult -join "`n"). Please check the error message above." -ErrorAction Stop
                return
            }
        }

        Write-Host "[SUCCESS] Pushed initial commit to remote."
    } catch {
        Write-Error "[ERROR] Failed to push to remote: $($_.Exception.Message)" -ErrorAction Stop
        return
    }

    Write-Host "\n--- Repository '$RepoName' created and bootstrapped successfully! ---"
    Write-Host "You can find your new repository at: $NewRepoPath"
    Write-Host "Please ensure GITHUB_TOKEN in '$EnvFilePath' is updated manually if you wish to automate future pushes."

    Set-Location C:\\Users\\balap\\AgentDraven\\BAIC
}

Create-BaselineRepository