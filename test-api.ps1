$baseUrl = "http://localhost:5002"

Write-Host "1. Registering user..."
$register = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body '{"email":"test@example.com","password":"Test1234","firstName":"Test","lastName":"User"}' -ContentType "application/json" -UseBasicParsing
Write-Host "Registered: $($register | ConvertTo-Json)"

Write-Host "`n2. Login..."
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"email":"test@example.com","password":"Test1234"}' -ContentType "application/json" -UseBasicParsing
$token = $login.accessToken
Write-Host "Access Token: $($token.Substring(0, [Math]::Min(50, $token.Length)))..."

Write-Host "`n3. Testing /auth/me..."
$me = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{Authorization="Bearer $token"} -UseBasicParsing
Write-Host "Me response: $($me | ConvertTo-Json)"