@echo off
setlocal
cd /d "%~dp0\.."
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22 or newer, then run this installer again.
  pause
  exit /b 1
)
set /p XUTU_EXTENSION_ID=Paste the 32-letter extension ID shown in the terminal: 
node native-host/install-windows.mjs "%XUTU_EXTENSION_ID%"
pause
