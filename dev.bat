@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: MagicBox Development Launcher with Agentation
:: This script starts both backend and frontend dev servers

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     MagicBox Development - Agentation Enabled 🚀          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 📦 Version: 1.3.0
echo.
echo Agentation is a visual annotation tool for AI agents.
echo It will appear in the bottom-right corner when you open the app.
echo.
echo Features:
echo   • Click any element to annotate
echo   • Add feedback with structured context
echo   • Copy markdown for AI agents (Claude Code, Cursor, etc.)
echo.
echo Starting development servers...
echo.

:: Check if node_modules exists in backend
if not exist "backend\node_modules" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

:: Check if node_modules exists in frontend
if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

:: Sync version before starting
if exist "scripts\sync-version.js" (
    echo [INFO] Syncing version info...
    node scripts\sync-version.js
    echo.
)

:: Start both servers concurrently
echo [INFO] Starting development servers...
echo   Backend:  http://localhost:8787
echo   Frontend: http://localhost:3000
echo.
echo Press Ctrl+C twice to stop both servers
echo.

npx concurrently "cd backend && npm run dev" "cd frontend && npm run dev" --names "API,WEB" --prefix-colors "cyan,magenta"

echo.
echo Development servers stopped.
echo.

endlocal
