@echo off
chcp 65001 >nul
title SNEP SMART v6 - Full Stack (Dev + Backend)

echo ╔════════════════════════════════════════════════════════════╗
echo ║       SNEP SMART v6 - Development + Backend                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

if not exist "node_modules" (
    echo [FOUT] node_modules niet gevonden!
    pause
    exit /b 1
)

echo [BACKEND] Express server starten op poort 3001...
start "SNEP Backend" cmd /k "node server.js"

timeout /t 3

echo [DEV] Vite dev server starten op poort 3000...
call npm run dev

pause
