@echo off
REM Avvia Soldatini Arena sul tuo PC (serve Node.js: https://nodejs.org)
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  Node.js non e' installato. Scaricalo da https://nodejs.org (versione LTS), installalo e riprova.
  echo.
  pause
  exit /b
)
start "" http://localhost:3000
node server.js
pause
