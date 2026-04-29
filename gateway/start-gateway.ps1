# Start Nginx Gateway
$ErrorActionPreference = "Stop"

$GatewayPath = "$PSScriptRoot"
$NginxExe = "$GatewayPath\nginx.exe"
$ConfigFile = "$GatewayPath\nginx.conf"
$PidFile = "$GatewayPath\logs\nginx.pid"

if (-not (Test-Path $NginxExe)) {
    Write-Error "nginx.exe not found in $GatewayPath"
    exit 1
}

if (-not (Test-Path "$GatewayPath\mime.types")) {
    Copy-Item "$GatewayPath\conf\mime.types" "$GatewayPath\" -ErrorAction SilentlyContinue
}

$Running = Get-Process -Name "nginx" -ErrorAction SilentlyContinue

if ($Running) {
    Write-Host "Gateway already running (PID: $($Running.Id))" -ForegroundColor Yellow
    exit 0
}

if (Test-Path $PidFile) {
    Remove-Item $PidFile -Force
}

Start-Process -FilePath $NginxExe -ArgumentList "-c", $ConfigFile -WorkingDirectory $GatewayPath -WindowStyle Hidden
Start-Sleep -Seconds 2

$Running = Get-Process -Name "nginx" -ErrorAction SilentlyContinue
if ($Running) {
    Write-Host "Gateway started on port 80 (PID: $($Running.Id))" -ForegroundColor Green
} else {
    Write-Host "Failed to start gateway. Check logs/error.log" -ForegroundColor Red
}