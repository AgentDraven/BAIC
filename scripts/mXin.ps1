# mXin.ps1 — MERIT check-in: commit, push to remote, release locks
# Usage: .\scripts\mXin.ps1
#        .\scripts\mXin.ps1 -Path docs\BAIC_theme.md
#        .\scripts\mXin.ps1 -All
#        .\scripts\mXin.ps1 -Message "feat: update theme" -PushTag

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [Alias("Target")]
    [string[]]$Path = @(),
    [string]$RepoPath = "",
    [Alias("CommitMessage")]
    [string]$Message = "",
    [string]$Branch = "main",
    [switch]$PushTag,
    [switch]$NonInteractive,
    [switch]$All,
    [switch]$List,
    [switch]$MultilineMessage
)

. "$PSScriptRoot\merit_git_common.ps1"
. "$PSScriptRoot\merit_mxin_mxout.ps1"

Invoke-MeritMxin -Path $Path -RepoPath $RepoPath -Message $Message -Branch $Branch `
    -PushTag:$PushTag -NonInteractive:$NonInteractive -All:$All -List:$List -MultilineMessage:$MultilineMessage
