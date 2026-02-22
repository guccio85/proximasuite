# Script per avviare NGROK + npm start automaticamente
# Esegui con: PowerShell -ExecutionPolicy Bypass -File start-dev.ps1

Write-Host "🚀 Avvio SNEP SMART in modalità sviluppo..." -ForegroundColor Cyan
Write-Host ""

# Cambia cartella al progetto
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Uccidi processi Node precedenti
Write-Host "🛑 Chiudo processi Node precedenti..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# Avvia NGROK in background
Write-Host "🌐 Avviando NGROK..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "ngrok" -ArgumentList "start snep --config ngrok.yml"

Start-Sleep -Seconds 3

# Avvia npm start
Write-Host "📦 Avviando server npm..." -ForegroundColor Green
npm start

# Quando closes npm start, ferma anche NGROK
Write-Host "⏹️  Fermando NGROK..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.Name -like "*ngrok*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ SNEP SMART arrestato." -ForegroundColor Cyan
