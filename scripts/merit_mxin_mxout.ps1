# merit_mxin_mxout.ps1 — implementation for mXin.ps1 / mXout.ps1 (dot-sourced, not run directly)

function Invoke-MeritMxout {
    param(
        [string[]]$Path = @(),
        [string]$RepoPath = "",
        [string]$Branch = "main",
        [switch]$List,
        [switch]$NonInteractive,
        [switch]$Force
    )

    if ([string]::IsNullOrWhiteSpace($RepoPath)) {
        $RepoPath = Get-GitRepoRoot
    } else {
        $RepoPath = Get-GitRepoRoot -StartPath $RepoPath
    }
    if (-not $RepoPath) {
        Write-Host "[ERROR] Not inside a Git repository." -ForegroundColor Red
        return
    }

    Write-MeritHeader "mXout - Check-Out (lock + pull from remote)"
    Write-Host "Repository: $RepoPath" -ForegroundColor Cyan
    Write-Host "Branch: $Branch`n" -ForegroundColor Cyan

    if ($List) {
        Show-MeritActiveLocks -RepoPath $RepoPath
        return
    }

    $allPaths = @($Path)

    if ($allPaths.Count -eq 0 -or [string]::IsNullOrWhiteSpace($allPaths[0])) {
        if ($NonInteractive) {
            Write-Host "[ERROR] -Path or -Target is required in non-interactive mode." -ForegroundColor Red
            return
        }
        Show-MeritActiveLocks -RepoPath $RepoPath
        $entered = Read-Host -Prompt "Enter file or directory path to lock and pull (repo-relative or absolute)"
        if ([string]::IsNullOrWhiteSpace($entered)) {
            Write-Host "[ERROR] No path provided." -ForegroundColor Red
            return
        }
        $allPaths = @($entered)
    }

    try {
        Invoke-MeritGitSync -RepoPath $RepoPath -Branch $Branch -Quiet:$NonInteractive | Out-Null
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
        return
    }

    $resolved = Resolve-MeritTargets -RepoPath $RepoPath -Paths $allPaths
    foreach ($err in $resolved.Errors) {
        Write-Host "[ERROR] $err" -ForegroundColor Red
    }
    if ($resolved.Targets.Count -eq 0) { return }

    $operator = Get-MeritOperator -RepoPath $RepoPath
    if ([string]::IsNullOrWhiteSpace($operator.Email)) {
        Write-Host "[ERROR] Git user.email is not configured." -ForegroundColor Red
        return
    }

    $activeLocks = Get-MeritActiveLocks -RepoPath $RepoPath
    $createdLocks = @()

    foreach ($target in $resolved.Targets) {
        $conflict = Test-MeritLockConflict -ActiveLocks $activeLocks -TargetPath $target.RelativePath `
            -CoveredFiles $target.Files -OperatorEmail $operator.Email
        if ($conflict.Conflict -and -not $Force) {
            Write-Host "[ERROR] $($conflict.Message)" -ForegroundColor Red
            return
        }

        Write-Host "[INFO] Locking '$($target.RelativePath)' ($($target.Files.Count) tracked file(s), recursive=$($target.Recursive))" -ForegroundColor DarkCyan
        $lockFile = New-MeritLockRecord -RepoPath $RepoPath -TargetPath $target.RelativePath `
            -Type $target.Type -Recursive $target.Recursive -CoveredFiles $target.Files -Operator $operator
        $createdLocks += $lockFile
    }

    Push-Location $RepoPath
    try {
        git add ops/locks 2>$null | Out-Null
        $status = git status --porcelain ops/locks 2>$null
        if (-not [string]::IsNullOrWhiteSpace($status)) {
            git commit -m "chore(mXout): lock paths for exclusive edit" | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Failed to commit lock files." }

            if (-not $NonInteractive) {
                $pushConfirm = Read-MeritConfirm -Prompt "Push lock reservation to origin/$Branch" -Default "ya"
                if ($pushConfirm -eq "na") {
                    Write-Host "[WARNING] Locks are local only until pushed. Others may not see your reservation." -ForegroundColor Yellow
                    return
                }
            }

            $pushResult = git push origin $Branch 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Lock push failed: $($pushResult -join "`n")" }
            Write-Host "[SUCCESS] Lock reservation pushed to remote." -ForegroundColor Green
        }

        Invoke-MeritGitSync -RepoPath $RepoPath -Branch $Branch -Quiet:$NonInteractive | Out-Null
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
        return
    } finally {
        Pop-Location
    }

    Write-Host "`n--- Locked for you ---" -ForegroundColor Cyan
    foreach ($target in $resolved.Targets) {
        Write-Host "  $($target.RelativePath) ($($target.Files.Count) file(s))" -ForegroundColor Green
    }
    Write-Host "`nResult: mXout complete. Edit locally, then run mXin to push and release locks." -ForegroundColor Green
}

function Invoke-MeritMxin {
    param(
        [string[]]$Path = @(),
        [string]$RepoPath = "",
        [string]$Message = "",
        [string]$Branch = "main",
        [switch]$PushTag,
        [switch]$NonInteractive,
        [switch]$All,
        [switch]$List,
        [switch]$MultilineMessage
    )

    if ([string]::IsNullOrWhiteSpace($RepoPath)) {
        $RepoPath = Get-GitRepoRoot
    } else {
        $RepoPath = Get-GitRepoRoot -StartPath $RepoPath
    }
    if (-not $RepoPath) {
        Write-Host "[ERROR] Not inside a Git repository." -ForegroundColor Red
        return
    }

    Write-MeritHeader "mXin - Check-In (commit + push + release locks)"
    Write-Host "Repository: $RepoPath" -ForegroundColor Cyan
    Write-Host "Branch: $Branch`n" -ForegroundColor Cyan

    $operator = Get-MeritOperator -RepoPath $RepoPath
    $myLocks = @(Get-MeritActiveLocks -RepoPath $RepoPath | Where-Object { $_.Email -eq $operator.Email })

    if ($List) {
        Write-Host "--- Your active locks ---" -ForegroundColor Cyan
        if ($myLocks.Count -eq 0) {
            Write-Host "[OK] You hold no locks." -ForegroundColor Green
        } else {
            $myLocks | ForEach-Object {
                Write-Host "  $($_.Path) ($($_.CoveredFiles.Count) file(s)) since $($_.LockedAt)" -ForegroundColor DarkCyan
            }
        }
        Show-MeritActiveLocks -RepoPath $RepoPath
        return
    }

    $scopePaths = @($Path | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

    $filterPaths = @()
    if ($scopePaths.Count -gt 0) {
        foreach ($p in $scopePaths) {
            $full = if ([System.IO.Path]::IsPathRooted($p)) { $p } else { Join-Path $RepoPath $p }
            if (Test-Path $full) {
                $filterPaths += Normalize-MeritRepoPath (Resolve-Path -LiteralPath $full).Path.Substring($RepoPath.Length).TrimStart('\', '/')
            } else {
                $filterPaths += (Normalize-MeritRepoPath $p)
            }
        }
    } elseif (-not $All -and $myLocks.Count -gt 0) {
        $filterPaths = @($myLocks | ForEach-Object { $_.Path })
        Write-Host "[INFO] Scoping check-in to your $($myLocks.Count) active lock(s)." -ForegroundColor DarkCyan
    } elseif (-not $All -and $myLocks.Count -eq 0) {
        if ($NonInteractive) {
            Write-Host "[ERROR] No locks held and -All not set. Use -All for full-repo closeout." -ForegroundColor Red
            return
        }
        $mode = Read-MeritConfirm -Prompt "No active locks. Check in ALL pending repo changes" -Default "ya"
        if ($mode -eq "na") {
            Write-Host "[INFO] mXin aborted." -ForegroundColor Yellow
            return
        }
        $All = $true
    }

    try {
        Invoke-MeritGitSync -RepoPath $RepoPath -Branch $Branch -Quiet:$NonInteractive | Out-Null
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
        return
    }

    $pending = Get-GitPendingChanges -RepoPath $RepoPath
    $items = if ($All) { @($pending.WorkingItems) } else { @(Get-MeritPendingItemsForPaths -RepoPath $RepoPath -FilterPaths $filterPaths) }

    # Always include lock file changes in scope when releasing locks
    $lockDirRel = Normalize-MeritRepoPath "ops/locks"
    foreach ($wi in $pending.WorkingItems) {
        $ip = Normalize-MeritRepoPath $wi.Path
        if ($ip.StartsWith("$lockDirRel/") -and ($items.Path -notcontains $wi.Path)) {
            $items += $wi
        }
    }

    Write-Host "--- Pending changes (check-in scope) ---" -ForegroundColor Cyan
    if ($items.Count -eq 0 -and $pending.Ahead -eq 0) {
        Write-Host "[OK] Nothing to check in within scope." -ForegroundColor Green
        if ($myLocks.Count -gt 0 -and -not $NonInteractive) {
            $release = Read-MeritConfirm -Prompt "Release your lock(s) without new commits" -Default "na"
            if ($release -eq "ya") {
                $removed = Remove-MeritLocksForOperator -RepoPath $RepoPath -OperatorEmail $operator.Email -ScopePaths $filterPaths
                Push-Location $RepoPath
                git add ops/locks 2>$null | Out-Null
                git commit -m "chore(mXin): release locks without content changes" 2>$null | Out-Null
                git push origin $Branch 2>&1 | Out-Null
                Pop-Location
                Write-Host "[SUCCESS] Released locks: $($removed -join ', ')" -ForegroundColor Green
            }
        }
        return
    }

    if ($items.Count -gt 0) {
        Write-Host "[PENDING] $($items.Count) file(s):" -ForegroundColor Yellow
        $n = 0
        foreach ($item in $items) {
            $n++
            Write-Host "  [$n] $($item.Label)" -ForegroundColor DarkCyan
        }
    }

    if ($pending.Ahead -gt 0) {
        Write-Host "[PENDING] $($pending.Ahead) unpushed commit(s) on $Branch" -ForegroundColor Yellow
    }

    $staged = @()
    if ($items.Count -gt 0) {
        if ($NonInteractive) {
            Push-Location $RepoPath
            foreach ($item in $items) { git add -- "$($item.Path)" 2>$null | Out-Null }
            Pop-Location
            $staged = @($items | ForEach-Object { $_.Path })
        } else {
            Write-Host "`n--- Stage files (ya/na/ay/an) ---" -ForegroundColor Cyan
            $staged = @(Invoke-MeritSelectiveStage -RepoPath $RepoPath -Items $items)
        }

        if ($staged.Count -eq 0 -and -not $NonInteractive) {
            Write-Host "[INFO] No files staged. mXin aborted." -ForegroundColor Yellow
            return
        }

        if ([string]::IsNullOrWhiteSpace($Message)) {
            if ($NonInteractive) {
                $Message = "chore(mXin): check-in locked changes"
            } else {
                $Message = Read-MeritCommitMessage -Default "chore(mXin): check-in locked changes" -Multiline:$MultilineMessage
            }
        }

        try {
            Invoke-GitCommit -Message $Message -RepoPath $RepoPath
            Write-Host "[SUCCESS] Committed $($staged.Count) file(s)." -ForegroundColor Green
        } catch {
            throw
        }
    }

    if ($myLocks.Count -gt 0) {
        $removed = Remove-MeritLocksForOperator -RepoPath $RepoPath -OperatorEmail $operator.Email -ScopePaths $filterPaths
        if ($removed.Count -gt 0) {
            Push-Location $RepoPath
            git add ops/locks 2>$null | Out-Null
            git commit -m "chore(mXin): release exclusive edit locks" 2>$null | Out-Null
            Pop-Location
            Write-Host "[SUCCESS] Released locks: $($removed -join ', ')" -ForegroundColor Green
        }
    }

    $pending = Get-GitPendingChanges -RepoPath $RepoPath
    if ($pending.Ahead -gt 0) {
        if (-not $NonInteractive) {
            $pushConfirm = Read-MeritConfirm -Prompt "Push $($pending.Ahead) commit(s) to origin/$Branch" -Default "ya"
            if ($pushConfirm -eq "na") {
                Write-Host "[INFO] Push skipped." -ForegroundColor Yellow
                return
            }
        }
        Push-Location $RepoPath
        try {
            $pushResult = git push origin $Branch 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Git push failed: $($pushResult -join "`n")" }
            Write-Host "[SUCCESS] Pushed to origin/$Branch." -ForegroundColor Green
        } finally {
            Pop-Location
        }
    }

    if ($PushTag) {
        $versionFile = Join-Path $RepoPath "VERSION"
        if (Test-Path $versionFile) {
            $version = (Get-Content $versionFile -Raw).Trim()
            if ($version -match '^\d+\.\d+\.\d+$') {
                Push-Location $RepoPath
                try {
                    $tag = "v$version"
                    git tag -a $tag -m "$tag - mXin release" 2>$null
                    git push origin $tag 2>&1 | Out-Null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "[SUCCESS] Tag $tag pushed." -ForegroundColor Green
                    }
                } finally {
                    Pop-Location
                }
            }
        }
    }

    Write-Host "`nResult: mXin check-in complete." -ForegroundColor Green
}
