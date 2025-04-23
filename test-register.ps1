$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:60000/api/auth/register" -Method POST -Headers $headers -Body $body -UseBasicParsing
