# Deprecated — use mXin.ps1 or mXout.ps1
Write-Host "[INFO] merit_xin_xout.ps1 is deprecated. Use .\scripts\mXin.ps1 or .\scripts\mXout.ps1" -ForegroundColor Yellow

if ($args -contains "-XOut" -or $args -contains "-Xout") {
    & "$PSScriptRoot\mXout.ps1" @args
} else {
    & "$PSScriptRoot\mXin.ps1" @args
}
