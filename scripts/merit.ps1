# Forward to MERIT operator script (canonical: merit-private-vault -> HumanBala runtime).
$MeritHome = Join-Path $env:USERPROFILE 'HumanBala\scripts\merit.ps1'
if (-not (Test-Path $MeritHome)) {
    Write-Error 'MERIT operator script not installed. Run merit-private-vault/scripts/install.ps1 first.'
    exit 1
}
& $MeritHome @args
if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }
