# Kill all processes on microservice ports
$ports = @(5001, 5002, 5003, 5004, 5005)

Write-Host "Stopping all microservices..." -ForegroundColor Yellow

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction Stop
                Write-Host "  Killed process on port $port (PID: $($conn.OwningProcess))" -ForegroundColor Green
            } catch {
                Write-Host "  Could not kill process on port $port" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  Port $port is free" -ForegroundColor Gray
    }
}

# Also kill nginx if running
$nginxProcesses = Get-Process nginx -ErrorAction SilentlyContinue
if ($nginxProcesses) {
    Stop-Process -Name nginx -Force -ErrorAction SilentlyContinue
    Write-Host "  Stopped nginx" -ForegroundColor Green
}

Write-Host "`nAll services stopped!" -ForegroundColor Green