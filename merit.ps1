# MERIT repository CLI shim. Resolve the configured operator runtime, then public skills.
param([Parameter(Position=0)][string]$Command='help',[Parameter(ValueFromRemainingArguments=$true)][string[]]$Rest)
$ErrorActionPreference='Stop'
$RepoRoot=(Resolve-Path $PSScriptRoot).Path
$Parent=(Split-Path $RepoRoot -Parent)
$candidates=@()
if($env:MERIT_RUNTIME_HOME){$candidates += Join-Path $env:MERIT_RUNTIME_HOME 'scripts\merit.ps1'}
$vaultRoot=Join-Path $Parent 'merit-private-vault'
$config=Join-Path $vaultRoot 'cfg\merit-config.json'
if(Test-Path -LiteralPath $config){try{$id=[string]((Get-Content -LiteralPath $config -Raw|ConvertFrom-Json).runtime.runtime_id);if($id){$candidates += Join-Path (Join-Path $env:USERPROFILE $id) 'scripts\merit.ps1'}}catch{}}
$candidates += Join-Path $vaultRoot 'scripts\merit.ps1'
$candidates += Join-Path $Parent 'merit-agent-skills\merit.ps1'
$cli=$candidates|Where-Object{Test-Path -LiteralPath $_}|Select-Object -First 1
if(-not $cli){throw "MERIT CLI not found. Run merit.ps1 runtime out or set MERIT_RUNTIME_HOME."}
if(-not $env:MERIT_VAULT_ROOT -and (Test-Path -LiteralPath $vaultRoot)){ $env:MERIT_VAULT_ROOT=$vaultRoot }
$runner=(Get-Command pwsh -ErrorAction SilentlyContinue).Source
if(-not $runner){$runner=(Get-Command powershell -ErrorAction Stop).Source}
& $runner -NoProfile -ExecutionPolicy Bypass -File $cli $Command @Rest
exit $LASTEXITCODE




