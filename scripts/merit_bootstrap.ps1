# merit_bootstrap.ps1 — MERIT canonical first-time repository bootstrap (§XI.D)
# Run from repo root after MERIT golden-standard layout exists (§I.A preflight).

param(
    [string]$RepoName = "",
    [string]$ParentDirectory = "",
    [switch]$Status,
    [switch]$Sync,
    [switch]$ScaffoldMissing,
    [switch]$SkipPreflight
)

. "$PSScriptRoot\merit_git_common.ps1"

function Test-RepositoryBootstrapped {
    param(
        [string]$RepoPath,
        [string]$GitUserName,
        [string]$RepoName
    )

    $checks = [ordered]@{
        DirectoryExists = Test-Path $RepoPath
        GitInitialized = Test-Path (Join-Path $RepoPath ".git")
        EnvLocalExists = Test-Path (Join-Path $RepoPath ".env.local")
        CfgExists = Test-Path (Join-Path $RepoPath "cfg")
        DocsExists = (Test-Path (Join-Path $RepoPath "docs")) -or (Test-Path (Join-Path $RepoPath "$RepoName docs"))
        BootstrappingDocExists = (Test-Path (Join-Path $RepoPath "docs\BOOTSTRAPPING.md")) -or
            (Test-Path (Join-Path $RepoPath "$RepoName docs\BOOTSTRAPPING.md"))
        EnvLocalSecured = Test-EnvLocalSecured (Join-Path $RepoPath ".gitignore")
    }

    $preflight = Test-MeritStructurePreflight -RepoPath $RepoPath -RepoName $RepoName
    $checks.MeritStructureReady = $preflight.StructureReady

    $EnvVars = Get-EnvVarsFromFile (Join-Path $RepoPath ".env.local")
    $checks.EmailConfigured = -not [string]::IsNullOrWhiteSpace($EnvVars["GIT_USER_EMAIL"])
    $checks.TokenConfigured = -not [string]::IsNullOrWhiteSpace($EnvVars["GITHUB_TOKEN"])

    Push-Location $RepoPath
    try {
        $gitUserName = git config user.name 2>$null
        $gitUserEmail = git config user.email 2>$null
        $checks.GitUserNameConfigured = ($gitUserName -eq $GitUserName)
        $checks.GitUserEmailConfigured = -not [string]::IsNullOrWhiteSpace($gitUserEmail)

        $remoteUrl = git remote get-url origin 2>$null
        $expectedRemote = "https://github.com/${GitUserName}/${RepoName}.git"
        $checks.RemoteOriginConfigured = ($LASTEXITCODE -eq 0) -and ($remoteUrl -eq $expectedRemote)

        $branch = git branch --show-current 2>$null
        $checks.OnMainBranch = ($branch -eq "main")

        $status = git status --porcelain 2>$null
        $checks.WorkingTreeClean = [string]::IsNullOrWhiteSpace($status)
        if (-not $checks.WorkingTreeClean) {
            $checks.UncommittedFiles = ($status -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        } else {
            $checks.UncommittedFiles = @()
        }

        git fetch origin 2>$null | Out-Null
        $aheadBehind = git rev-list --left-right --count origin/main...HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $aheadBehind) {
            $parts = $aheadBehind -split "\s+"
            $checks.BehindRemote = [int]$parts[0]
            $checks.AheadRemote = [int]$parts[1]
            $checks.InSyncWithRemote = ($checks.BehindRemote -eq 0 -and $checks.AheadRemote -eq 0)
        } else {
            $checks.BehindRemote = $null
            $checks.AheadRemote = $null
            $checks.InSyncWithRemote = $false
        }
    } finally {
        Pop-Location
    }

    $ghResult = gh repo view "${GitUserName}/${RepoName}" 2>$null
    $checks.RemoteRepoExists = ($LASTEXITCODE -eq 0)
    $checks.GhCliAvailable = $null -ne (Get-Command gh -ErrorAction SilentlyContinue)

    $requiredKeys = @(
        "DirectoryExists", "GitInitialized", "EnvLocalExists", "CfgExists", "DocsExists",
        "BootstrappingDocExists", "EnvLocalSecured", "EmailConfigured", "TokenConfigured",
        "GitUserNameConfigured", "GitUserEmailConfigured", "RemoteOriginConfigured",
        "RemoteRepoExists", "OnMainBranch", "MeritStructureReady"
    )

    $checks.IsFullyBootstrapped = ($requiredKeys | ForEach-Object { $checks[$_] } | Where-Object { $_ -eq $false }).Count -eq 0
    $checks.Preflight = $preflight
    return $checks
}

function Show-BootstrapStatus {
    param(
        [string]$RepoName,
        [string]$RepoPath,
        [hashtable]$Checks,
        [string]$GitUserName,
        [switch]$VerifyOnly
    )

    Write-MeritHeader "MERIT Repository Bootstrap Status"
    Write-Host "Repository: $RepoName" -ForegroundColor Cyan
    Write-Host "Local path: $RepoPath" -ForegroundColor Cyan
    Write-Host "GitHub URL: https://github.com/${GitUserName}/${RepoName}" -ForegroundColor Cyan
    if ($VerifyOnly) {
        Write-Host "Mode: verify-only (already bootstrapped)`n" -ForegroundColor Cyan
    } else {
        Write-Host ""
    }

    Write-MeritCheckLine "MERIT golden-standard layout (section I.A)" $Checks.MeritStructureReady
    Write-MeritCheckLine "Local directory exists" $Checks.DirectoryExists
    Write-MeritCheckLine "Local Git repository initialized" $Checks.GitInitialized
    Write-MeritCheckLine "cfg/ folder present" $Checks.CfgExists
    Write-MeritCheckLine "docs/ folder present" $Checks.DocsExists
    Write-MeritCheckLine "BOOTSTRAPPING.md present" $Checks.BootstrappingDocExists
    Write-MeritCheckLine ".env.local present" $Checks.EnvLocalExists
    Write-MeritCheckLine ".env.local secured in .gitignore" $Checks.EnvLocalSecured
    Write-MeritCheckLine "Git email configured" $Checks.EmailConfigured
    Write-MeritCheckLine "GitHub PAT configured" $Checks.TokenConfigured
    Write-MeritCheckLine "Git user.name set to AgentDraven" $Checks.GitUserNameConfigured
    Write-MeritCheckLine "Git user.email configured" $Checks.GitUserEmailConfigured
    Write-MeritCheckLine "Remote origin configured" $Checks.RemoteOriginConfigured "https://github.com/${GitUserName}/${RepoName}.git"
    Write-MeritCheckLine "GitHub remote repository exists" $Checks.RemoteRepoExists
    Write-MeritCheckLine "Working on main branch" $Checks.OnMainBranch

    if ($Checks.WorkingTreeClean) {
        Write-Host "[OK] Working tree clean (no uncommitted changes)" -ForegroundColor Green
    } else {
        Write-Host "[PENDING] Uncommitted local changes present" -ForegroundColor Yellow
        foreach ($file in $Checks.UncommittedFiles) {
            Write-Host "      $file" -ForegroundColor DarkCyan
        }
        Write-Host '      Run mXin.ps1 for check-in, or merit_bootstrap.ps1 -Sync for quick sync.' -ForegroundColor DarkCyan
    }

    if ($null -ne $Checks.AheadRemote -and $null -ne $Checks.BehindRemote) {
        if ($Checks.InSyncWithRemote) {
            Write-Host "[OK] Local main is in sync with origin/main" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Local main is ahead by $($Checks.AheadRemote), behind by $($Checks.BehindRemote)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[INFO] Remote sync status could not be verified" -ForegroundColor Yellow
    }

    Write-Host "`n========================================================" -ForegroundColor Magenta
    if ($Checks.IsFullyBootstrapped -and $Checks.WorkingTreeClean -and $Checks.InSyncWithRemote) {
        Write-Host "Result: Bootstrap complete. Nothing to do." -ForegroundColor Green
    } elseif ($Checks.IsFullyBootstrapped -and -not $Checks.WorkingTreeClean) {
        Write-Host 'Result: Bootstrap complete. Local edits waiting - use mXin.ps1.' -ForegroundColor Green
    } elseif ($Checks.IsFullyBootstrapped) {
        Write-Host "Result: Bootstrap complete. Review sync notes above." -ForegroundColor Green
    } else {
        Write-Host "Result: Bootstrap incomplete. Re-run without -Status to repair missing items." -ForegroundColor Yellow
    }
    Write-Host "========================================================`n" -ForegroundColor Magenta
}

function Sync-PendingChanges {
    param([string]$RepoPath)

    Push-Location $RepoPath
    try {
        $status = git status --porcelain
        if (-not [string]::IsNullOrWhiteSpace($status)) {
            Write-Host "[INFO] Uncommitted changes detected. Staging and committing..." -ForegroundColor DarkCyan
            git add . | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Git add failed." }
            Invoke-GitCommit -Message "chore: sync repository changes" -RepoPath $RepoPath
            Write-Host "[SUCCESS] Local changes committed." -ForegroundColor Green
        }

        git fetch origin 2>$null | Out-Null
        $aheadBehind = git rev-list --left-right --count origin/main...HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $aheadBehind) {
            $parts = $aheadBehind -split "\s+"
            $ahead = [int]$parts[1]
            if ($ahead -gt 0) {
                Write-Host "[INFO] Pushing $($ahead) local commit(s) to origin/main..." -ForegroundColor DarkCyan
                $pushResult = git push -u origin main 2>&1
                if ($LASTEXITCODE -ne 0) { throw "Git push failed: $($pushResult -join "`n")" }
                Write-Host "[SUCCESS] Remote synchronized." -ForegroundColor Green
            } else {
                Write-Host "[INFO] No local commits waiting to push." -ForegroundColor DarkCyan
            }
        }
    } finally {
        Pop-Location
    }
}

function Invoke-MeritBootstrap {
    $CurrentPath = (Get-Location).Path
    $DefaultRepoName = Split-Path $CurrentPath -Leaf
    $DefaultParentDir = Split-Path $CurrentPath -Parent
    $GitUserName = "AgentDraven"

    if (-not $Status -and -not $Sync) {
        if ([string]::IsNullOrWhiteSpace($RepoName)) {
            $RepoName = Read-Host -Prompt "Enter the name for the repository [Default: $DefaultRepoName]"
            if ([string]::IsNullOrWhiteSpace($RepoName)) { $RepoName = $DefaultRepoName }
        }
        if ([string]::IsNullOrWhiteSpace($ParentDirectory)) {
            $ParentDirectory = Read-Host -Prompt "Enter the full path of the parent directory [Default: $DefaultParentDir]"
            if ([string]::IsNullOrWhiteSpace($ParentDirectory)) { $ParentDirectory = $DefaultParentDir }
        }
    } else {
        if ([string]::IsNullOrWhiteSpace($RepoName)) { $RepoName = $DefaultRepoName }
        if ([string]::IsNullOrWhiteSpace($ParentDirectory)) { $ParentDirectory = $DefaultParentDir }
    }

    $NewRepoPath = Join-Path $ParentDirectory $RepoName
    $OriginalPath = $CurrentPath

    try {
        if (-not $SkipPreflight) {
            $preflight = Test-MeritStructurePreflight -RepoPath $NewRepoPath -RepoName $RepoName
            Show-MeritStructurePreflight -Preflight $preflight

            if (-not $preflight.StructureReady -or $ScaffoldMissing) {
                if ($ScaffoldMissing -or (-not $Status -and -not $Sync)) {
                    Invoke-MeritScaffoldMissing -Preflight $preflight | Out-Null
                    $preflight = Test-MeritStructurePreflight -RepoPath $NewRepoPath -RepoName $RepoName
                    if (-not $preflight.StructureReady) {
                        Write-Host "[ERROR] MERIT structure still incomplete after scaffold. Fix layout and retry." -ForegroundColor Red
                        return
                    }
                } elseif (-not $preflight.StructureReady) {
                    Write-Host "[ERROR] Required MERIT layout missing. Run with -ScaffoldMissing or create structure manually." -ForegroundColor Red
                    return
                }
            }
        }

        $checks = Test-RepositoryBootstrapped -RepoPath $NewRepoPath -GitUserName $GitUserName -RepoName $RepoName

        if ($Status -or ($checks.IsFullyBootstrapped -and -not $Sync)) {
            Show-BootstrapStatus -RepoName $RepoName -RepoPath $NewRepoPath -Checks $checks -GitUserName $GitUserName -VerifyOnly:$checks.IsFullyBootstrapped
            if ($Sync -and $checks.IsFullyBootstrapped) {
                Sync-PendingChanges -RepoPath $NewRepoPath
                $checks = Test-RepositoryBootstrapped -RepoPath $NewRepoPath -GitUserName $GitUserName -RepoName $RepoName
                Show-BootstrapStatus -RepoName $RepoName -RepoPath $NewRepoPath -Checks $checks -GitUserName $GitUserName -VerifyOnly
            }
            return
        }

        if ($checks.IsFullyBootstrapped -and $Sync) {
            Write-Host "[INFO] Repository already bootstrapped. Running sync-only mode." -ForegroundColor DarkCyan
            Sync-PendingChanges -RepoPath $NewRepoPath
            $checks = Test-RepositoryBootstrapped -RepoPath $NewRepoPath -GitUserName $GitUserName -RepoName $RepoName
            Show-BootstrapStatus -RepoName $RepoName -RepoPath $NewRepoPath -Checks $checks -GitUserName $GitUserName -VerifyOnly
            return
        }

        if ($NewRepoPath.StartsWith($CurrentPath, [System.StringComparison]::OrdinalIgnoreCase) -and $NewRepoPath -ne $CurrentPath) {
            Write-Host "`n[WARNING] Nested repository target: $NewRepoPath" -ForegroundColor Yellow
            $confirm = Read-MeritConfirm -Prompt "Proceed with nested repository inside current workspace" -Default "na"
            if ($confirm -eq "na") {
                Write-Host "[ERROR] Aborted to prevent nested repository." -ForegroundColor Red
                return
            }
        }

        Write-MeritHeader "MERIT Repository Bootstrap"
        Write-Host "Target: $RepoName at $NewRepoPath`n" -ForegroundColor Cyan

        if (-not (Test-Path $NewRepoPath)) {
            Write-Host "[STEP 1/10] Creating directory..." -ForegroundColor Cyan
            New-Item -ItemType Directory -Path $NewRepoPath -Force | Out-Null
            Write-Host "[SUCCESS] Directory created.`n" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Directory exists: $NewRepoPath`n" -ForegroundColor DarkCyan
        }

        Set-Location $NewRepoPath
        $EnvFilePath = Join-Path $NewRepoPath ".env.local"
        $CfgPath = Join-Path $NewRepoPath "cfg"
        $GitIgnorePath = Join-Path $NewRepoPath ".gitignore"

        Write-Host "[STEP 2/10] Setting up .env.local, cfg/, and .gitignore..." -ForegroundColor Cyan
        if (-not (Test-Path $CfgPath)) { New-Item -ItemType Directory -Path $CfgPath -Force | Out-Null }
        if (-not (Test-Path $EnvFilePath)) { New-Item -ItemType File -Path $EnvFilePath -Force | Out-Null }

        if (-not (Test-Path $GitIgnorePath)) {
            $confirm = Read-MeritConfirm -Prompt "Create .gitignore and secure .env.local" -Default "ya"
            if ($confirm -eq "ya") {
                New-Item -ItemType File -Path $GitIgnorePath -Force | Out-Null
                Add-Content -Path $GitIgnorePath -Value "`n# .env.local for secrets`n.env.local"
                Write-Host "[SUCCESS] Created .gitignore and secured .env.local.`n" -ForegroundColor Green
            } else {
                Write-Host "[WARNING] Proceeding without .gitignore.`n" -ForegroundColor Yellow
            }
        } elseif (-not (Test-EnvLocalSecured $GitIgnorePath)) {
            $confirm = Read-MeritConfirm -Prompt "Add .env.local to .gitignore" -Default "ya"
            if ($confirm -eq "ya") {
                Add-Content -Path $GitIgnorePath -Value "`n# .env.local for secrets`n.env.local"
                Write-Host "[SUCCESS] Secured .env.local in .gitignore.`n" -ForegroundColor Green
            }
        } else {
            Write-Host "[SUCCESS] .env.local secured in .gitignore.`n" -ForegroundColor Green
        }

        $EnvVars = Get-EnvVarsFromFile $EnvFilePath

        Write-Host "[STEP 3/10] Configuring Git user.name..." -ForegroundColor Cyan
        git config user.name "$GitUserName" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.name failed." }
        Write-Host "[SUCCESS] Git user.name = $GitUserName`n" -ForegroundColor Green

        $GitUserEmail = $EnvVars["GIT_USER_EMAIL"]
        if ([string]::IsNullOrWhiteSpace($GitUserEmail)) {
            $GitUserEmail = Read-Host -Prompt "[INPUT] Git email (saved to .env.local)"
            Add-Content -Path $EnvFilePath -Value "`nGIT_USER_EMAIL=$GitUserEmail"
        }

        Write-Host "[STEP 4/10] Configuring Git user.email..." -ForegroundColor Cyan
        git config user.email "$GitUserEmail" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git config user.email failed." }
        Write-Host "[SUCCESS] Git user.email set.`n" -ForegroundColor Green

        $GitHubToken = $EnvVars["GITHUB_TOKEN"]
        if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
            Write-Host "[NOTICE] GitHub PAT required for remote create/push." -ForegroundColor Yellow
            $GitHubToken = Read-Host -Prompt "[INPUT] GitHub PAT (saved to .env.local)"
            Add-Content -Path $EnvFilePath -Value "`nGITHUB_TOKEN=$GitHubToken"
        }

        Write-Host "[STEP 5/10] Initializing Git..." -ForegroundColor Cyan
        if (-not (Test-Path (Join-Path $NewRepoPath ".git"))) {
            git init | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Git init failed." }
            Write-Host "[SUCCESS] Git initialized.`n" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Existing Git repo.`n" -ForegroundColor DarkCyan
        }

        $DocsPath = if (Test-Path (Join-Path $NewRepoPath "$RepoName docs")) {
            Join-Path $NewRepoPath "$RepoName docs"
        } else {
            Join-Path $NewRepoPath "docs"
        }
        Write-Host "[STEP 6/10] Ensuring docs/ and BOOTSTRAPPING.md..." -ForegroundColor Cyan
        if (-not (Test-Path $DocsPath)) { New-Item -ItemType Directory -Path $DocsPath -Force | Out-Null }

        $bootstrapDoc = Join-Path $DocsPath "BOOTSTRAPPING.md"
        if (-not (Test-Path $bootstrapDoc)) {
            $template = Join-Path $PSScriptRoot "..\docs\BOOTSTRAPPING.md"
            if (Test-Path $template) {
                Copy-Item -Path $template -Destination $bootstrapDoc -Force
                Write-Host "[SUCCESS] BOOTSTRAPPING.md copied.`n" -ForegroundColor Green
            } else {
                Write-Host "[INFO] BOOTSTRAPPING.md not found in template; add manually.`n" -ForegroundColor DarkCyan
            }
        } else {
            Write-Host "[INFO] BOOTSTRAPPING.md present.`n" -ForegroundColor DarkCyan
        }

        Write-Host "[STEP 7/10] Staging and committing..." -ForegroundColor Cyan
        git add . | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git add failed." }
        $gitStatus = git status --porcelain
        if ([string]::IsNullOrWhiteSpace($gitStatus)) {
            Write-Host "[INFO] Nothing to commit.`n" -ForegroundColor DarkCyan
        } else {
            Invoke-GitCommit -Message "feat: initial MERIT repository bootstrap" -RepoPath $NewRepoPath
            Write-Host "[SUCCESS] Initial commit created.`n" -ForegroundColor Green
        }

        Write-Host "[STEP 8/10] GitHub remote..." -ForegroundColor Cyan
        if ($null -eq (Get-Command gh -ErrorAction SilentlyContinue)) {
            throw "GitHub CLI (gh) not found. Install from https://cli.github.com/"
        }
        $repoCheck = gh repo view "${GitUserName}/${RepoName}" 2>&1
        if ($LASTEXITCODE -ne 0) {
            $createRepoResult = gh repo create "${GitUserName}/${RepoName}" --public --source=. --description "MERIT repository: ${RepoName}" 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Failed to create remote: $($createRepoResult -join "`n")" }
            Write-Host "[SUCCESS] Remote created.`n" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Remote already exists.`n" -ForegroundColor DarkCyan
        }

        $RemoteUrl = "https://github.com/${GitUserName}/${RepoName}.git"
        Write-Host "[STEP 9/10] Configuring origin..." -ForegroundColor Cyan
        $existingRemote = git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            if ($existingRemote -ne $RemoteUrl) { git remote set-url origin $RemoteUrl | Out-Null }
        } else {
            git remote add origin $RemoteUrl | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Git remote add failed." }
        }
        Write-Host "[SUCCESS] origin = $RemoteUrl`n" -ForegroundColor Green

        Write-Host "[STEP 10/10] Pushing to main..." -ForegroundColor Cyan
        git branch -M main | Out-Null
        git fetch origin 2>$null | Out-Null
        $aheadBehind = git rev-list --left-right --count origin/main...HEAD 2>$null
        $shouldPush = $true
        if ($LASTEXITCODE -eq 0 -and $aheadBehind) {
            $parts = $aheadBehind -split "\s+"
            $shouldPush = ([int]$parts[1] -gt 0)
        }
        if ($shouldPush) {
            $pushResult = git push -u origin main 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Git push failed: $($pushResult -join "`n")" }
            Write-Host "[SUCCESS] Pushed to origin/main.`n" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Already up to date with origin/main.`n" -ForegroundColor DarkCyan
        }

        $checks = Test-RepositoryBootstrapped -RepoPath $NewRepoPath -GitUserName $GitUserName -RepoName $RepoName
        Show-BootstrapStatus -RepoName $RepoName -RepoPath $NewRepoPath -Checks $checks -GitUserName $GitUserName
    } catch {
        Write-Host "[ERROR] Bootstrap failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    } finally {
        Set-Location $OriginalPath
        Write-Host "[INFO] Restored directory: $OriginalPath" -ForegroundColor DarkCyan
    }
}

Invoke-MeritBootstrap
