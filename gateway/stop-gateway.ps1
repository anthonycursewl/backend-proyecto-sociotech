# Stop Nginx Gateway
$ErrorActionPreference = "Stop"

$NginxExe = "$PSScriptRoot\nginx.exe"

if (Test-Path $NginxExe) {
    & $NginxExe -s stop
    Write-Host "Gateway stopped" -ForegroundColor Green
} else {
    Write-Host "nginx.exe not found" -ForegroundColor Red
}