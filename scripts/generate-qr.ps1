# Script per generare QR code dal tunnel NGROK attivo
# Esegui con: PowerShell -ExecutionPolicy Bypass -File generate-qr.ps1

Write-Host "📱 Generatore QR Code SNEP SMART" -ForegroundColor Cyan
Write-Host ""

# Cambia cartella al progetto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Esegui lo script Node
node generate-qr.js

# Se lo script Node ha successo, apri il file HTML
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🌐 Aprendo QR code nel browser..." -ForegroundColor Green
    Start-Sleep -Seconds 1
    
    $qrPath = Join-Path $projectPath "qr-code.html"
    if (Test-Path $qrPath) {
        Start-Process $qrPath
    }
}
