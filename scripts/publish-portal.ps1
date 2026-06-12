# Forward to MERIT publish-portal (portal/ subfolder -> here.now only).
$MeritHome = Join-Path $env:USERPROFILE 'HumanBala\scripts\merit.ps1'
if (-not (Test-Path $MeritHome)) {
    Write-Error 'MERIT operator script not installed. Run merit.ps1 sync first.'
    exit 1
}
& $MeritHome publish-portal @args
if ($null -ne $LASTEXITCODE) { exit $LASTEXITCODE }
