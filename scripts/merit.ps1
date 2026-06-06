# merit.ps1 - MERIT operator script (bootstrap | mXin | mXout | release)
#   .\scripts\merit.ps1 bootstrap [-Status] [-Sync] [-ScaffoldMissing]
#   .\scripts\merit.ps1 mXout  [-Path <file-or-dir>] [-List]
#   .\scripts\merit.ps1 mXin   [-All] [-Message <text>] [-PushTag] [-List]
#   .\scripts\merit.ps1 release [-Bump patch|minor|major] [-Message <notes>]

param(
    [Parameter(Position = 0)]
    [ValidateSet('bootstrap', 'mXin', 'mXout', 'release', 'help')]
    [string]$Action = '',

    [string]$RepoName = '',
    [string]$ParentDirectory = '',
    [switch]$Status,
    [switch]$Sync,
    [switch]$ScaffoldMissing,
    [switch]$SkipPreflight,

    [Parameter(ValueFromRemainingArguments = $true)]
    [Alias('Target')]
    [string[]]$Path = @(),
    [string]$RepoPath = '',
    [string]$Branch = 'main',
    [Alias('CommitMessage')]
    [string]$Message = '',
    [ValidateSet('patch', 'minor', 'major', '')]
    [string]$Bump = '',
    [switch]$PushTag,
    [switch]$NonInteractive,
    [switch]$All,
    [switch]$List,
    [switch]$MultilineMessage,
    [switch]$Force
)

function Show-MeritUsage {
    Write-Host ''
    Write-Host 'MERIT operator script - pick an action:' -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  .\scripts\merit.ps1 bootstrap   First-time Git + GitHub setup (-Status, -Sync)'
    Write-Host '  .\scripts\merit.ps1 mXout       Lock path + pull from remote (-Path, -List)'
    Write-Host '  .\scripts\merit.ps1 mXin        Commit + push + release locks (-All, -Message)'
    Write-Host '  .\scripts\merit.ps1 release     Bump VERSION, CHANGELOG, tag, push (-Bump patch|minor|major)'
    Write-Host ''
}
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

# MERIT Â§II.F â€” per-item confirmation with bulk shortcuts
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

    Write-Host "`nEntry points (MERIT Â§II.A):" -ForegroundColor Cyan
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
            Set-Content -Path $runPath -Value "#!/usr/bin/env python3`n# MERIT operations entry â€” implement menu per Â§II.A`n" -Encoding UTF8
            Write-Host "[SUCCESS] Created run_$slug.py" -ForegroundColor Green
        }
    }
    if ($Preflight.MissingEntryPoints -contains 'test_[project].py') {
        $slug = ($Preflight.RepoName -replace '\s+', '').ToLowerInvariant()
        $testPath = Join-Path $Preflight.RepoPath "test_$slug.py"
        if (-not (Test-Path $testPath)) {
            Set-Content -Path $testPath -Value "#!/usr/bin/env python3`n# MERIT test entry â€” implement unified runner per Â§II.A`n" -Encoding UTF8
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
            Invoke-GitCommit -Message "chore(mXout): lock paths for exclusive edit" -RepoPath $RepoPath | Out-Null
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
    Write-Host "`nResult: mXout complete. Edit locally, then run merit.ps1 mXin to push and release locks." -ForegroundColor Green
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
                Invoke-GitCommit -Message "chore(mXin): release locks without content changes" -RepoPath $RepoPath 2>$null | Out-Null
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
            Invoke-GitCommit -Message "chore(mXin): release exclusive edit locks" -RepoPath $RepoPath 2>$null | Out-Null
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
        Write-Host '      Run merit.ps1 mXin for check-in, or merit.ps1 bootstrap -Sync for quick sync.' -ForegroundColor DarkCyan
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
        Write-Host 'Result: Bootstrap complete. Local edits waiting - use merit.ps1 mXin.' -ForegroundColor Green
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

function Get-MeritVersionFromFile {
    param([string]$RepoPath)

    $versionFile = Join-Path $RepoPath 'VERSION'
    if (-not (Test-Path $versionFile)) {
        throw 'VERSION file not found at repo root.'
    }
    $raw = (Get-Content $versionFile -Raw).Trim()
    if ($raw -notmatch '^\d+\.\d+\.\d+$') {
        throw "Invalid VERSION '$raw' (expected MAJOR.MINOR.PATCH)."
    }
    return $raw
}

function Get-MeritNextVersion {
    param(
        [string]$Current,
        [ValidateSet('patch', 'minor', 'major')]
        [string]$Bump
    )

    $parts = $Current -split '\.'
    $major = [int]$parts[0]
    $minor = [int]$parts[1]
    $patch = [int]$parts[2]

    switch ($Bump) {
        'patch' { return "$major.$minor.$($patch + 1)" }
        'minor' { return "$major.$($minor + 1).0" }
        'major' { return "$($major + 1).0.0" }
    }
}

function Get-MeritChangelogSection {
    param([ValidateSet('patch', 'minor', 'major')] [string]$Bump)

    switch ($Bump) {
        'major' { return '### Breaking' }
        'minor' { return '### Added' }
        'patch' { return '### Changed' }
    }
}

function Add-MeritChangelogEntry {
    param(
        [string]$RepoPath,
        [string]$Version,
        [string]$Bump,
        [string]$Notes
    )

    $changelogPath = Join-Path $RepoPath 'CHANGELOG.md'
    $date = Get-Date -Format 'yyyy-MM-dd'
    $section = Get-MeritChangelogSection -Bump $Bump

    $bullets = ($Notes -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' } | ForEach-Object {
        if ($_ -match '^-\s') { $_ } else { "- $_" }
    }) -join "`n"

    $entry = @"

## [$Version] - $date

$section
$bullets

"@

    if (Test-Path $changelogPath) {
        $content = Get-Content $changelogPath -Raw
        if ($content -match '(?ms)^#\s*CHANGELOG\s*\r?\n') {
            $content = $content -replace '(?ms)^(#\s*CHANGELOG\s*\r?\n)', "`$1$entry"
        } else {
            $content = "# CHANGELOG`n$entry$content"
        }
    } else {
        $content = "# CHANGELOG`n$entry"
    }

    Set-Content -Path $changelogPath -Value $content.TrimEnd() + [Environment]::NewLine -Encoding UTF8
}

function Invoke-MeritRelease {
    param(
        [string]$RepoPath = '',
        [string]$BumpKind = '',
        [string]$Notes = '',
        [string]$Branch = 'main',
        [switch]$NonInteractive
    )

    if ([string]::IsNullOrWhiteSpace($RepoPath)) {
        $RepoPath = Get-GitRepoRoot
    } else {
        $RepoPath = Get-GitRepoRoot -StartPath $RepoPath
    }
    if (-not $RepoPath) {
        Write-Host '[ERROR] Not inside a Git repository.' -ForegroundColor Red
        return
    }

    Write-MeritHeader 'release - Baseline VERSION + CHANGELOG + tag'
    Write-Host "Repository: $RepoPath" -ForegroundColor Cyan

    $current = Get-MeritVersionFromFile -RepoPath $RepoPath
    Write-Host "Current VERSION: $current" -ForegroundColor Cyan

    if ([string]::IsNullOrWhiteSpace($BumpKind)) {
        if ($NonInteractive) {
            Write-Host '[ERROR] -Bump patch|minor|major is required in non-interactive mode.' -ForegroundColor Red
            return
        }
        Write-Host ''
        Write-Host 'Bump kind:' -ForegroundColor Cyan
        Write-Host '  [1] patch  - bug fixes / routine closeout (x.y.Z+1)'
        Write-Host '  [2] minor  - new features / docs milestone (x.Y+1.0)  Human Bala approval'
        Write-Host '  [3] major  - breaking / architecture shift (X+1.0.0)  Human Bala approval'
        $pick = Read-Host -Prompt 'Choose 1, 2, or 3'
        $BumpKind = switch ($pick.Trim()) {
            '1' { 'patch' }
            '2' { 'minor' }
            '3' { 'major' }
            'patch' { 'patch' }
            'minor' { 'minor' }
            'major' { 'major' }
            default {
                Write-Host '[ERROR] Invalid bump choice.' -ForegroundColor Red
                return
            }
        }
    }

    if ($BumpKind -in @('minor', 'major')) {
        Write-Host "[NOTICE] MERIT section VIII.A: MINOR and MAJOR baselines require Human Bala approval." -ForegroundColor Yellow
        if (-not $NonInteractive) {
            $approved = Read-MeritConfirm -Prompt "Confirm you are authorized to set a new $BumpKind baseline" -Default 'na'
            if ($approved -eq 'na') {
                Write-Host '[INFO] Release aborted.' -ForegroundColor Yellow
                return
            }
        }
    }

    $next = Get-MeritNextVersion -Current $current -Bump $BumpKind
    $tagName = "v$next"

    Push-Location $RepoPath
    try {
        git fetch origin 2>$null | Out-Null
        $tagExists = git rev-parse "refs/tags/$tagName" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[ERROR] Tag $tagName already exists." -ForegroundColor Red
            return
        }
    } finally {
        Pop-Location
    }

    Write-Host "New VERSION:   $next ($BumpKind bump)" -ForegroundColor Green
    Write-Host "New tag:       $tagName" -ForegroundColor Green

    if ([string]::IsNullOrWhiteSpace($Notes)) {
        if ($NonInteractive) {
            $Notes = "Release $next ($BumpKind baseline)"
        } else {
            Write-Host ''
            $Notes = Read-MeritCommitMessage -Default "Release $next ($BumpKind baseline)" -Multiline
        }
    }

    if (-not $NonInteractive) {
        $proceed = Read-MeritConfirm -Prompt "Apply $current -> $next, update CHANGELOG, commit, tag, and push" -Default 'ya'
        if ($proceed -eq 'na') {
            Write-Host '[INFO] Release aborted.' -ForegroundColor Yellow
            return
        }
    }

    $versionFile = Join-Path $RepoPath 'VERSION'
    Set-Content -Path $versionFile -Value "$next`n" -Encoding UTF8 -NoNewline
    Add-MeritChangelogEntry -RepoPath $RepoPath -Version $next -Bump $BumpKind -Notes $Notes

    Push-Location $RepoPath
    try {
        git add VERSION CHANGELOG.md
        if ($LASTEXITCODE -ne 0) { throw 'Git add failed.' }

        $commitMsg = "release: v$next ($BumpKind baseline)"
        Pop-Location
        Invoke-GitCommit -Message $commitMsg -RepoPath $RepoPath
        Push-Location $RepoPath
        Write-Host '[SUCCESS] VERSION and CHANGELOG committed.' -ForegroundColor Green

        $tagMsg = "$tagName - $Notes"
        git tag -a $tagName -m $tagMsg
        if ($LASTEXITCODE -ne 0) { throw "Failed to create tag $tagName." }
        Write-Host "[SUCCESS] Created annotated tag $tagName." -ForegroundColor Green

        if (-not $NonInteractive) {
            $pushConfirm = Read-MeritConfirm -Prompt "Push commit and tag $tagName to origin/$Branch" -Default 'ya'
            if ($pushConfirm -eq 'na') {
                Write-Host '[WARNING] Release committed locally only. Push when ready.' -ForegroundColor Yellow
                return
            }
        }

        $pushResult = git push origin $Branch 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Push failed: $($pushResult -join "`n")" }

        $tagPush = git push origin $tagName 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Tag push failed: $($tagPush -join "`n")" }

        Write-Host "[SUCCESS] Pushed $Branch and $tagName to origin." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
        throw
    } finally {
        Pop-Location
    }

    Write-Host "`nResult: Baseline $next is live (tag $tagName)." -ForegroundColor Green
}


if ([string]::IsNullOrWhiteSpace($Action)) {
    if ($Status -or $Sync -or $ScaffoldMissing -or $SkipPreflight) {
        $Action = 'bootstrap'
    } else {
        Show-MeritUsage
        return
    }
}

switch ($Action) {
    'bootstrap' {
        Invoke-MeritBootstrap
    }
    'mXin' {
        Invoke-MeritMxin -Path $Path -RepoPath $RepoPath -Message $Message -Branch $Branch `
            -PushTag:$PushTag -NonInteractive:$NonInteractive -All:$All -List:$List -MultilineMessage:$MultilineMessage
    }
    'mXout' {
        Invoke-MeritMxout -Path $Path -RepoPath $RepoPath -Branch $Branch `
            -List:$List -NonInteractive:$NonInteractive -Force:$Force
    }
    'help' {
        Show-MeritUsage
    }
    'release' {
        Invoke-MeritRelease -RepoPath $RepoPath -BumpKind $Bump -Notes $Message -Branch $Branch -NonInteractive:$NonInteractive
    }
    default {
        Write-Host "[ERROR] Unknown action: $Action" -ForegroundColor Red
        Show-MeritUsage
    }
}

