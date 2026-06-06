# Backward-compatible alias — use merit_bootstrap.ps1 (MERIT §XI.D)
Write-Host "[INFO] create_baseline_repo.ps1 is deprecated. Use .\scripts\merit_bootstrap.ps1" -ForegroundColor Yellow
& "$PSScriptRoot\merit_bootstrap.ps1" @args
