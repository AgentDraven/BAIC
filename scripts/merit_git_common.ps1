# merit_git_common.ps1 — shared helpers for merit_bootstrap.ps1, mXin.ps1, mXout.ps1
# MERIT §II.F (YA/NA/AY/AN), §XI.D

function Get-EnvVarsFromFile {
    param([string]$EnvFilePath)

    $EnvVars = @{}
    if (-not (Test-Path $EnvFilePath)) {
        return $EnvVars
    }

    $EnvContent = Get-Content $EnvFilePath -Raw -ErrorAction SilentlyContinue
    if ($EnvContent) {
        $EnvContent.Split("`n") | ForEach-Object {
            if ($_ -match "^\s*([^=]+?)\s*=\s*(.*)\s*$") {
                $EnvVars[$matches[1].Trim()] = $matches[2].Trim()
            }
        }
    }

    return $EnvVars
}

function Test-EnvLocalSecured {
    param([string]$GitIgnorePath)

    if (-not (Test-Path $GitIgnorePath)) {
        return $false
    }

    $GitIgnoreContent = Get-Content $GitIgnorePath -Raw -ErrorAction SilentlyContinue
    return ($GitIgnoreContent -match "(?m)^\s*\.env\.local\s*$")
}

function Write-MeritHeader {
    param([string]$Title)
    Write-Host "`n========================================================" -ForegroundColor Magenta
    Write-Host "--- $Title ---" -ForegroundColor Magenta
    Write-Host "========================================================" -ForegroundColor Magenta
}

function Write-MeritCheckLine {
    param([string]$Label, [bool]$Passed, [string]$Detail = "", [string]$PendingLabel = "MISSING")
    if ($Passed) {
        Write-Host "[OK] $Label" -ForegroundColor Green
    } else {
        Write-Host "[$PendingLabel] $Label" -ForegroundColor Yellow
    }
    if ($Detail) {
        Write-Host "      $Detail" -ForegroundColor DarkCyan
    }
}

# MERIT §II.F — per-item confirmation with bulk shortcuts
function Read-MeritConfirm {
    param(
        [string]$Prompt,
        [string]$Default = "ya",
        [switch]$AllowBulk
    )

    $suffix = if ($AllowBulk) { " (ya/na/ay/an)" } else { " (ya/na)" }
    $hint = if ($Default) { " [Default: $Default]" } else { "" }

    while ($true) {
        $raw = Read-Host -Prompt "$Prompt$suffix$hint"
        $answer = if ([string]::IsNullOrWhiteSpace($raw)) { $Default } else { $raw.Trim().ToLowerInvariant() }

        switch ($answer) {
            { $_ -in @("ya", "y", "yes") } { return "ya" }
            { $_ -in @("na", "n", "no") } { return "na" }
            "ay" { if ($AllowBulk) { return "ay" }; break }
            "an" { if ($AllowBulk) { return "an" }; break }
            default { Write-Host "[NOTICE] Use ya (yes), na (no)" -ForegroundColor Yellow -NoNewline
                      if ($AllowBulk) { Write-Host ", ay (all yes), or an (all no)." -ForegroundColor Yellow }
                      else { Write-Host "." -ForegroundColor Yellow } }
        }
    }
}

# Read a free-form commit message (quotes, +, --, etc. are safe; blank = default).
function Read-MeritCommitMessage {
    param(
        [string]$Default = "chore(mXin): check-in locked changes",
        [switch]$Multiline
    )

    Write-Host 'Commit message (free text - quotes, +, and -- are OK):' -ForegroundColor Cyan
    if ($Multiline) {
        Write-Host "  Type lines; blank line when finished." -ForegroundColor DarkCyan
        $lines = @()
        while ($true) {
            $line = Read-Host -Prompt "> "
            if ([string]::IsNullOrWhiteSpace($line)) {
                if ($lines.Count -eq 0) {
                    Write-Host "[INFO] Using default commit message." -ForegroundColor DarkCyan
                    return $Default
                }
                break
            }
            $lines += $line
        }
        return ($lines -join [Environment]::NewLine)
    }

    $line = Read-Host -Prompt "> "
    if ([string]::IsNullOrWhiteSpace($line)) {
        Write-Host "[INFO] Using default commit message." -ForegroundColor DarkCyan
        return $Default
    }
    return $line
}

# Pass commit message to git without shell splitting (handles quotes, +, spaces, etc.).
function Invoke-GitCommit {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [string]$RepoPath = ""
    )

    if ([string]::IsNullOrWhiteSpace($Message)) {
        throw "Commit message cannot be empty."
    }

    $msgFile = Join-Path ([System.IO.Path]::GetTempPath()) ("merit-commit-$([guid]::NewGuid().ToString('n')).txt")
    [System.IO.File]::WriteAllText($msgFile, $Message, (New-Object System.Text.UTF8Encoding $false))

    $pushed = $false
    if ($RepoPath) {
        Push-Location $RepoPath
        $pushed = $true
    }

    try {
        & git commit -F $msgFile
        if ($LASTEXITCODE -ne 0) { throw "Git commit failed." }
    } finally {
        if ($pushed) { Pop-Location }
        Remove-Item -LiteralPath $msgFile -Force -ErrorAction SilentlyContinue
    }
}

function Test-MeritStructurePreflight {
    param(
        [string]$RepoPath,
        [string]$RepoName = ""
    )

    if ([string]::IsNullOrWhiteSpace($RepoName)) {
        $RepoName = Split-Path $RepoPath -Leaf
    }

    $brandedDocs = Join-Path $RepoPath "$RepoName docs"
    $plainDocs = Join-Path $RepoPath "docs"
    $docsPath = if (Test-Path $brandedDocs) { $brandedDocs } else { $plainDocs }

    $requiredDirs = @(
        @{ Name = "core/"; Path = Join-Path $RepoPath "core" }
        @{ Name = "scripts/"; Path = Join-Path $RepoPath "scripts" }
        @{ Name = "tests/"; Path = Join-Path $RepoPath "tests" }
        @{ Name = "cfg/"; Path = Join-Path $RepoPath "cfg" }
        @{ Name = "docs/ or {Name} docs/"; Path = $docsPath }
        @{ Name = "output/"; Path = Join-Path $RepoPath "output" }
    )

    $recommendedRootFiles = @(
        @{ Name = "README.md"; Path = Join-Path $RepoPath "README.md" }
        @{ Name = "VERSION"; Path = Join-Path $RepoPath "VERSION" }
        @{ Name = "CHANGELOG.md"; Path = Join-Path $RepoPath "CHANGELOG.md" }
        @{ Name = "AGENTS.md"; Path = Join-Path $RepoPath "AGENTS.md" }
        @{ Name = ".env.example"; Path = Join-Path $RepoPath ".env.example" }
    )

    $optionalDirs = @(
        @{ Name = "ops/"; Path = Join-Path $RepoPath "ops" }
    )

    $result = [ordered]@{
        RepoPath = $RepoPath
        RepoName = $RepoName
        DocsPath = $docsPath
        RequiredDirs = @()
        MissingRequiredDirs = @()
        RecommendedFiles = @()
        MissingRecommendedFiles = @()
        OptionalMissing = @()
        EntryPoints = @()
        MissingEntryPoints = @()
    }

    foreach ($dir in $requiredDirs) {
        $exists = Test-Path $dir.Path
        $result.RequiredDirs += @{ Name = $dir.Name; Path = $dir.Path; Exists = $exists }
        if (-not $exists) { $result.MissingRequiredDirs += $dir.Name }
    }

    foreach ($file in $recommendedRootFiles) {
        $exists = Test-Path $file.Path
        $result.RecommendedFiles += @{ Name = $file.Name; Path = $file.Path; Exists = $exists }
        if (-not $exists) { $result.MissingRecommendedFiles += $file.Name }
    }

    foreach ($dir in $optionalDirs) {
        if (-not (Test-Path $dir.Path)) {
            $result.OptionalMissing += $dir.Name
        }
    }

    $runPattern = Join-Path $RepoPath "run_*.py"
    $testPattern = Join-Path $RepoPath "test_*.py"
    $runFiles = @(Get-ChildItem -Path $runPattern -ErrorAction SilentlyContinue)
    $testFiles = @(Get-ChildItem -Path $testPattern -ErrorAction SilentlyContinue)
    $result.EntryPoints = @{
        Run = ($runFiles | ForEach-Object { $_.Name })
        Test = ($testFiles | ForEach-Object { $_.Name })
    }
    if ($runFiles.Count -eq 0) { $result.MissingEntryPoints += 'run_[project].py' }
    if ($testFiles.Count -eq 0) { $result.MissingEntryPoints += 'test_[project].py' }

    $result.StructureReady = ($result.MissingRequiredDirs.Count -eq 0)
    $result.RecommendedReady = ($result.MissingRecommendedFiles.Count -eq 0 -and $result.MissingEntryPoints.Count -eq 0)

    return $result
}

function Show-MeritStructurePreflight {
    param([hashtable]$Preflight)

    Write-MeritHeader "MERIT Structure Preflight (section I.A)"
    Write-Host "Repository: $($Preflight.RepoName)" -ForegroundColor Cyan
    Write-Host "Path: $($Preflight.RepoPath)`n" -ForegroundColor Cyan

    Write-Host "Required directories:" -ForegroundColor Cyan
    foreach ($dir in $Preflight.RequiredDirs) {
        Write-MeritCheckLine $dir.Name $dir.Exists
    }

    Write-Host "`nRecommended root files:" -ForegroundColor Cyan
    foreach ($file in $Preflight.RecommendedFiles) {
        Write-MeritCheckLine $file.Name $file.Exists
    }

    Write-Host "`nEntry points (MERIT §II.A):" -ForegroundColor Cyan
    if ($Preflight.EntryPoints.Run.Count -gt 0) {
        Write-Host "[OK] run entry: $($Preflight.EntryPoints.Run -join ', ')" -ForegroundColor Green
    } else {
        Write-Host '[MISSING] run_[project].py' -ForegroundColor Yellow
    }
    if ($Preflight.EntryPoints.Test.Count -gt 0) {
        Write-Host "[OK] test entry: $($Preflight.EntryPoints.Test -join ', ')" -ForegroundColor Green
    } else {
        Write-Host '[MISSING] test_[project].py' -ForegroundColor Yellow
    }

    if ($Preflight.OptionalMissing.Count -gt 0) {
        Write-Host "`nOptional (not yet present): $($Preflight.OptionalMissing -join ', ')" -ForegroundColor DarkCyan
    }

    Write-Host ""
    if ($Preflight.StructureReady) {
        Write-Host "Result: Required MERIT layout is present." -ForegroundColor Green
    } else {
        Write-Host 'Result: Required layout incomplete - scaffold missing dirs or create structure before bootstrap.' -ForegroundColor Yellow
    }
    if (-not $Preflight.RecommendedReady) {
        Write-Host 'Note: Recommended files/entry points missing - bootstrap can continue; add before first release.' -ForegroundColor DarkCyan
    }
    Write-Host "========================================================`n" -ForegroundColor Magenta
}

function Invoke-MeritScaffoldMissing {
    param(
        [hashtable]$Preflight,
        [switch]$Force
    )

    if (-not $Preflight.StructureReady -or $Preflight.MissingRecommendedFiles.Count -gt 0) {
        if (-not $Force) {
            $confirm = Read-MeritConfirm -Prompt "Scaffold missing MERIT directories and placeholder root files" -Default "ya"
            if ($confirm -eq "na") { return $false }
        }
    } else {
        return $true
    }

    foreach ($dir in $Preflight.RequiredDirs) {
        if (-not $dir.Exists) {
            New-Item -ItemType Directory -Path $dir.Path -Force | Out-Null
            Write-Host "[SUCCESS] Created $($dir.Name)" -ForegroundColor Green
        }
    }

    $placeholders = @{
        "README.md" = "# $($Preflight.RepoName)`n`nSee docs/BOOTSTRAPPING.md for setup.`n"
        "VERSION" = "0.0.1`n"
        "CHANGELOG.md" = @"
# CHANGELOG

## [0.0.1] - $(Get-Date -Format 'yyyy-MM-dd')

### Added
- Initial MERIT scaffold

"@
        "AGENTS.md" = @"
# AGENTS.md

- L1: %USERPROFILE%\HumanBala\MERIT.instructions
- L2: %USERPROFILE%\HumanBala\AgentDraven.instructions
- Docs: $($Preflight.DocsPath)

"@
        ".env.example" = "GIT_USER_EMAIL=`nGITHUB_TOKEN=`n"
    }

    foreach ($file in $Preflight.RecommendedFiles) {
        if (-not $file.Exists -and $placeholders.ContainsKey($file.Name)) {
            Set-Content -Path $file.Path -Value $placeholders[$file.Name] -Encoding UTF8
            Write-Host "[SUCCESS] Created $($file.Name)" -ForegroundColor Green
        }
    }

    if ($Preflight.MissingEntryPoints -contains 'run_[project].py') {
        $slug = ($Preflight.RepoName -replace '\s+', '').ToLowerInvariant()
        $runPath = Join-Path $Preflight.RepoPath "run_$slug.py"
        if (-not (Test-Path $runPath)) {
            Set-Content -Path $runPath -Value "#!/usr/bin/env python3`n# MERIT operations entry — implement menu per §II.A`n" -Encoding UTF8
            Write-Host "[SUCCESS] Created run_$slug.py" -ForegroundColor Green
        }
    }
    if ($Preflight.MissingEntryPoints -contains 'test_[project].py') {
        $slug = ($Preflight.RepoName -replace '\s+', '').ToLowerInvariant()
        $testPath = Join-Path $Preflight.RepoPath "test_$slug.py"
        if (-not (Test-Path $testPath)) {
            Set-Content -Path $testPath -Value "#!/usr/bin/env python3`n# MERIT test entry — implement unified runner per §II.A`n" -Encoding UTF8
            Write-Host "[SUCCESS] Created test_$slug.py" -ForegroundColor Green
        }
    }

    if (-not (Test-Path (Join-Path $Preflight.RepoPath "ops"))) {
        New-Item -ItemType Directory -Path (Join-Path $Preflight.RepoPath "ops\scripts") -Force | Out-Null
        Write-Host "[SUCCESS] Created ops/scripts/" -ForegroundColor Green
    }

    return $true
}

function Get-GitPendingChanges {
    param([string]$RepoPath)

    Push-Location $RepoPath
    try {
        $porcelain = git status --porcelain 2>$null
        $items = @()
        if (-not [string]::IsNullOrWhiteSpace($porcelain)) {
            foreach ($line in ($porcelain -split "`n")) {
                if ([string]::IsNullOrWhiteSpace($line)) { continue }
                $status = $line.Substring(0, 2)
                $path = $line.Substring(3).Trim()
                $items += [PSCustomObject]@{
                    Status = $status
                    Path = $path
                    Label = "$status $path"
                }
            }
        }

        git fetch origin 2>$null | Out-Null
        $aheadBehind = git rev-list --left-right --count origin/main...HEAD 2>$null
        $ahead = 0
        $behind = 0
        if ($LASTEXITCODE -eq 0 -and $aheadBehind) {
            $parts = $aheadBehind -split "\s+"
            $behind = [int]$parts[0]
            $ahead = [int]$parts[1]
        }

        return [PSCustomObject]@{
            WorkingItems = $items
            Ahead = $ahead
            Behind = $behind
            Branch = (git branch --show-current 2>$null)
        }
    } finally {
        Pop-Location
    }
}

function Invoke-MeritSelectiveStage {
    param(
        [string]$RepoPath,
        [array]$Items
    )

    if ($Items.Count -eq 0) { return @() }

    $staged = @()
    $acceptAll = $false
    $rejectAll = $false
    $index = 0

    Push-Location $RepoPath
    try {
        foreach ($item in $Items) {
            $index++
            if ($rejectAll) { continue }
            if ($acceptAll) {
                git add -- "$($item.Path)" 2>$null | Out-Null
                if ($LASTEXITCODE -eq 0) { $staged += $item.Path }
                continue
            }

            Write-Host "`n[$index/$($Items.Count)] $($item.Label)" -ForegroundColor Cyan
            $answer = Read-MeritConfirm -Prompt "Stage this file for commit" -Default "ya" -AllowBulk

            switch ($answer) {
                "ya" {
                    git add -- "$($item.Path)" 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) { $staged += $item.Path }
                }
                "na" { }
                "ay" {
                    $acceptAll = $true
                    git add -- "$($item.Path)" 2>$null | Out-Null
                    if ($LASTEXITCODE -eq 0) { $staged += $item.Path }
                }
                "an" {
                    $rejectAll = $true
                }
            }
        }
    } finally {
        Pop-Location
    }

    return $staged
}

function Get-GitRepoRoot {
    param([string]$StartPath = (Get-Location).Path)

    Push-Location $StartPath
    try {
        $root = git rev-parse --show-toplevel 2>$null
        if ($LASTEXITCODE -ne 0) { return $null }
        return $root
    } finally {
        Pop-Location
    }
}

function Get-MeritOperator {
    param([string]$RepoPath)

    Push-Location $RepoPath
    try {
        return [PSCustomObject]@{
            Name = (git config user.name 2>$null)
            Email = (git config user.email 2>$null)
        }
    } finally {
        Pop-Location
    }
}

function Get-MeritLockDirectory {
    param([string]$RepoPath)
    return Join-Path $RepoPath "ops\locks"
}

function ConvertTo-MeritLockFileName {
    param([string]$RelativePath)
    $safe = ($RelativePath -replace '\\', '/').Trim('/')
    if ([string]::IsNullOrWhiteSpace($safe)) { $safe = "_root_" }
    return ($safe -replace '[/\\:]', '__') + ".lock.json"
}

function Normalize-MeritRepoPath {
    param([string]$Path)
    return ($Path -replace '\\', '/').Trim('/')
}

function Test-MeritPathsOverlap {
    param([string]$PathA, [string]$PathB)

    $a = Normalize-MeritRepoPath $PathA
    $b = Normalize-MeritRepoPath $PathB
    if ($a -eq $b) { return $true }
    return ($a.StartsWith("$b/")) -or ($b.StartsWith("$a/"))
}

function Get-MeritActiveLocks {
    param([string]$RepoPath)

    $lockDir = Get-MeritLockDirectory -RepoPath $RepoPath
    $locks = @()
    if (-not (Test-Path $lockDir)) { return $locks }

    Get-ChildItem -Path $lockDir -Filter "*.lock.json" -File -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            $obj = Get-Content $_.FullName -Raw | ConvertFrom-Json
            $locks += [PSCustomObject]@{
                File = $_.Name
                FullPath = $_.FullName
                Path = $obj.path
                Type = $obj.type
                Recursive = [bool]$obj.recursive
                Owner = $obj.owner
                Email = $obj.email
                LockedAt = $obj.lockedAt
                LockId = $obj.lockId
                CoveredFiles = @($obj.coveredFiles)
            }
        } catch {
            Write-Host "[WARNING] Skipping invalid lock file: $($_.Name)" -ForegroundColor Yellow
        }
    }
    return $locks
}

function ConvertTo-MeritWindowsSubPath {
    param([string]$RelativePath)
    return $RelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar
}

function Get-MeritTrackedPathsUnderTarget {
    param(
        [string]$RepoPath,
        [string]$TargetPath
    )

    Push-Location $RepoPath
    try {
        $normalized = Normalize-MeritRepoPath $TargetPath
        if ([string]::IsNullOrWhiteSpace($normalized)) {
            return @(git ls-files 2>$null)
        }

        $localPath = Join-Path $RepoPath (ConvertTo-MeritWindowsSubPath $normalized)
        if ((Test-Path $localPath) -and (Get-Item -LiteralPath $localPath).PSIsContainer) {
            $prefix = if ($normalized.EndsWith('/')) { $normalized } else { "$normalized/" }
            return @(git ls-files "$prefix*" 2>$null)
        }

        $single = git ls-files -- "$normalized" 2>$null
        if ($single) { return @($single) }

        if (Test-Path $localPath) {
            return @($normalized)
        }
        return @()
    } finally {
        Pop-Location
    }
}

function Resolve-MeritTargets {
    param(
        [string]$RepoPath,
        [string[]]$Paths
    )

    $resolved = [ordered]@{
        Targets = @()
        AllFiles = @()
        Errors = @()
    }

    foreach ($raw in $Paths) {
        if ([string]::IsNullOrWhiteSpace($raw)) { continue }
        $full = if ([System.IO.Path]::IsPathRooted($raw)) { $raw } else { Join-Path $RepoPath $raw }
        if (-not (Test-Path $full)) {
            $resolved.Errors += "Path not found: $raw"
            continue
        }

        $rel = Normalize-MeritRepoPath (Resolve-Path -LiteralPath $full).Path.Substring($RepoPath.Length).TrimStart('\', '/')
        $files = @(Get-MeritTrackedPathsUnderTarget -RepoPath $RepoPath -TargetPath $rel)
        if ($files.Count -eq 0) {
            $item = Get-Item -LiteralPath $full
            if ($item.PSIsContainer) {
                $resolved.Errors += "No tracked files under directory: $rel"
            } else {
                $resolved.Errors += "File is not tracked by git: $rel (run git add first or choose a tracked path)"
            }
            continue
        }

        $isDir = (Get-Item -LiteralPath $full).PSIsContainer
        $resolved.Targets += [PSCustomObject]@{
            RelativePath = $rel
            Type = if ($isDir) { "directory" } else { "file" }
            Recursive = $isDir
            Files = $files
        }
        $resolved.AllFiles += $files
    }

    $resolved.AllFiles = @($resolved.AllFiles | Select-Object -Unique)
    return $resolved
}

function Test-MeritLockConflict {
    param(
        [array]$ActiveLocks,
        [string]$TargetPath,
        [array]$CoveredFiles,
        [string]$OperatorEmail
    )

    foreach ($lock in $ActiveLocks) {
        if ($lock.Email -eq $OperatorEmail) { continue }

        if (Test-MeritPathsOverlap -PathA $TargetPath -PathB $lock.Path) {
            return [PSCustomObject]@{
                Conflict = $true
                Message = "Locked by $($lock.Owner) <$($lock.Email)> since $($lock.LockedAt) on '$($lock.Path)'"
                Lock = $lock
            }
        }

        foreach ($file in $CoveredFiles) {
            if ($lock.CoveredFiles -contains $file) {
                return [PSCustomObject]@{
                    Conflict = $true
                    Message = "File '$file' locked by $($lock.Owner) <$($lock.Email)>"
                    Lock = $lock
                }
            }
        }
    }

    return [PSCustomObject]@{ Conflict = $false }
}

function New-MeritLockRecord {
    param(
        [string]$RepoPath,
        [string]$TargetPath,
        [string]$Type,
        [bool]$Recursive,
        [array]$CoveredFiles,
        [object]$Operator
    )

    $lockDir = Get-MeritLockDirectory -RepoPath $RepoPath
    if (-not (Test-Path $lockDir)) {
        New-Item -ItemType Directory -Path $lockDir -Force | Out-Null
    }

    $lockFile = Join-Path $lockDir (ConvertTo-MeritLockFileName -RelativePath $TargetPath)
    $record = [ordered]@{
        path = $TargetPath
        type = $Type
        recursive = $Recursive
        coveredFiles = @($CoveredFiles)
        owner = $Operator.Name
        email = $Operator.Email
        lockedAt = (Get-Date).ToUniversalTime().ToString("o")
        lockId = [guid]::NewGuid().ToString()
    }

    $record | ConvertTo-Json -Depth 5 | Set-Content -Path $lockFile -Encoding UTF8
    return $lockFile
}

function Remove-MeritLocksForOperator {
    param(
        [string]$RepoPath,
        [string]$OperatorEmail,
        [string[]]$ScopePaths = @()
    )

    $removed = @()
    foreach ($lock in (Get-MeritActiveLocks -RepoPath $RepoPath)) {
        if ($lock.Email -ne $OperatorEmail) { continue }
        if ($ScopePaths.Count -gt 0) {
            $inScope = $false
            foreach ($scope in $ScopePaths) {
                if ((Test-MeritPathsOverlap -PathA $lock.Path -PathB $scope) -or ($lock.CoveredFiles | Where-Object { $ScopePaths -contains $_ })) {
                    $inScope = $true
                    break
                }
            }
            if (-not $inScope) { continue }
        }
        Remove-Item -LiteralPath $lock.FullPath -Force
        $removed += $lock.Path
    }
    return $removed
}

function Show-MeritActiveLocks {
    param([string]$RepoPath)

    $locks = Get-MeritActiveLocks -RepoPath $RepoPath
    Write-Host "--- Active mXout locks ---" -ForegroundColor Cyan
    if ($locks.Count -eq 0) {
        Write-Host "[OK] No active locks." -ForegroundColor Green
        return
    }
    foreach ($lock in $locks) {
        $kind = if ($lock.Recursive) { "dir (recursive)" } else { $lock.Type }
        Write-Host "  $($lock.Path) [$kind] - $($lock.Owner) <$($lock.Email)> since $($lock.LockedAt)" -ForegroundColor DarkCyan
        if ($lock.CoveredFiles.Count -gt 0 -and $lock.CoveredFiles.Count -le 8) {
            $lock.CoveredFiles | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
        } elseif ($lock.CoveredFiles.Count -gt 8) {
            Write-Host "      $($lock.CoveredFiles.Count) tracked file(s)" -ForegroundColor DarkGray
        }
    }
}

function Get-MeritPendingItemsForPaths {
    param(
        [string]$RepoPath,
        [string[]]$FilterPaths
    )

    $pending = Get-GitPendingChanges -RepoPath $RepoPath
    if ($FilterPaths.Count -eq 0) { return $pending.WorkingItems }

    return @($pending.WorkingItems | Where-Object {
        $itemPath = Normalize-MeritRepoPath $_.Path
        foreach ($filter in $FilterPaths) {
            $f = Normalize-MeritRepoPath $filter
            if ($itemPath -eq $f -or $itemPath.StartsWith("$f/")) { return $true }
        }
        $false
    })
}

function Invoke-MeritGitSync {
    param(
        [string]$RepoPath,
        [string]$Branch = "main",
        [switch]$Quiet
    )

    Push-Location $RepoPath
    try {
        git fetch origin 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Git fetch failed." }

        $aheadBehind = git rev-list --left-right --count "origin/$Branch...HEAD" 2>$null
        $behind = 0
        if ($aheadBehind) {
            $parts = $aheadBehind -split "\s+"
            $behind = [int]$parts[0]
        }

        if ($behind -eq 0) { return 0 }

        if (-not $Quiet) {
            Write-Host "[PENDING] Local is $behind commit(s) behind origin/$Branch." -ForegroundColor Yellow
            $confirm = Read-MeritConfirm -Prompt "Pull from origin/$Branch before continuing" -Default "ya"
            if ($confirm -eq "na") { throw "Sync aborted by operator." }
        }

        $pullResult = git pull origin $Branch 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Git pull failed: $($pullResult -join "`n")" }
        Write-Host "[SUCCESS] Pulled from origin/$Branch." -ForegroundColor Green
        return $behind
    } finally {
        Pop-Location
    }
}
