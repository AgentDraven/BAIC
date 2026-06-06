# mXout.ps1 — MERIT check-out: lock path(s) and pull from remote (recursive for directories)
# Usage: .\scripts\mXout.ps1 -Path docs\BAIC_theme.md
#        .\scripts\mXout.ps1 -Path docs
#        .\scripts\mXout.ps1 -List

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [Alias("Target")]
    [string[]]$Path = @(),
    [string]$RepoPath = "",
    [string]$Branch = "main",
    [switch]$List,
    [switch]$NonInteractive,
    [switch]$Force
)

. "$PSScriptRoot\merit_git_common.ps1"
. "$PSScriptRoot\merit_mxin_mxout.ps1"

Invoke-MeritMxout -Path $Path -RepoPath $RepoPath -Branch $Branch `
    -List:$List -NonInteractive:$NonInteractive -Force:$Force
