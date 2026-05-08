# deploy.ps1 — Rebuild and redeploy GLP-1 Tracker Docker container
# Run from the project root: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "==> Building Docker image..." -ForegroundColor Cyan
docker compose build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed." -ForegroundColor Red; exit 1 }

Write-Host "==> Restarting container with new image..." -ForegroundColor Cyan
docker compose up -d
if ($LASTEXITCODE -ne 0) { Write-Host "Deploy failed." -ForegroundColor Red; exit 1 }

Write-Host "==> Waiting for server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 4

Write-Host "==> Health check..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/api/health" -TimeoutSec 10
    if ($response.status -eq "ok") {
        Write-Host "Deploy successful. GLP-1 Tracker is live." -ForegroundColor Green
        Write-Host "  DB: $($response.db)" -ForegroundColor Gray
    } else {
        Write-Host "Health check returned unexpected response." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Health check failed: $_" -ForegroundColor Red
    Write-Host "Check logs with: docker compose logs glp1-tracker" -ForegroundColor Yellow
    exit 1
}
