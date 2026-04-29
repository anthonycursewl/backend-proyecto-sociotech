# Start all microservices in separate windows
$projectPath = "D:\Users\58426\projects\backend-proyecto-sociotech"

Write-Host "Starting all microservices..." -ForegroundColor Green
Write-Host ""

$services = @(
    @{Name="Auth Service"; Port=5001; Script="npm run start:auth"},
    @{Name="User Service"; Port=5002; Script="npm run start:user"},
    @{Name="Main Service"; Port=5003; Script="npm run start:main"},
    @{Name="Sync Service"; Port=5004; Script="npm run start:sync"},
    @{Name="Telemetry Service"; Port=5005; Script="npm run start:telemetry"}
)

foreach ($service in $services) {
    $cmd = "cd $projectPath; $($service.Script)"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Write-Host "Started $($service.Name) on port $($service.Port)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service ports:" -ForegroundColor White
Write-Host "  - Auth:      http://localhost:5001" -ForegroundColor Gray
Write-Host "  - User:      http://localhost:5002" -ForegroundColor Gray
Write-Host "  - Main:      http://localhost:5003" -ForegroundColor Gray
Write-Host "  - Sync:      http://localhost:5004" -ForegroundColor Gray
Write-Host "  - Telemetry: http://localhost:5005" -ForegroundColor Gray
Write-Host ""
Write-Host "Gateway: http://localhost" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop a service" -ForegroundColor DarkGray