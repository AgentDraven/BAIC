# Forward to MERIT operator script (canonical: merit-private-vault -> HumanBala runtime).
$env:MERIT_OPERATOR_CWD = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$VaultRoot = if ($env:MERIT_VAULT_ROOT) { $env:MERIT_VAULT_ROOT } else { Join-Path (Split-Path $PSScriptRoot -Parent | Split-Path -Parent) 'merit-private-vault' }
$MeritHome = Join-Path $VaultRoot 'scripts\merit.ps1'
if (-not (Test-Path $MeritHome)) {
    Write-Error 'MERIT operator script not installed. Run merit-private-vault/scripts/install.ps1 first.'
    exit 1
}
& $MeritHome @args
if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }
