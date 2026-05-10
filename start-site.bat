@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   Starting local website...
echo   Project: %~dp0
echo ========================================
echo.

if not exist "node_modules" (
  echo node_modules not found. Installing dependencies first...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Press any key to exit.
    pause >nul
    exit /b 1
  )
)

echo Launching dev server on http://127.0.0.1:5173/
start "React Local Site" cmd /k "cd /d ""%~dp0"" && npm run dev -- --host 127.0.0.1 --port 5173"

echo Waiting for server...
timeout /t 5 /nobreak >nul
start "" http://127.0.0.1:5173/

echo.
echo Done. If the page does not open immediately, wait a few seconds and refresh.
echo You can re-open this site anytime by double-clicking start-site.bat
echo.
endlocal
