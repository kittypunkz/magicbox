@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: MagicBox Update Script for magicbox.bankapirak.com
:: Usage: update.bat [backend|frontend|full|migrate]

set "DOMAIN=magicbox.bankapirak.com"
set "API_DOMAIN=api.magicbox.bankapirak.com"
set "ACCOUNT_ID=49b16ed3ff0d8209f2a3da300341283b"
set "DB_ID=846b28b9-2aac-49a5-a3fa-8ad7cf925d9f"

:: Colors
set "RED=[31m"
set "GREEN=[32m"
set "BLUE=[34m"
set "YELLOW=[33m"
set "NC=[0m"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║       MagicBox Update - magicbox.bankapirak.com            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Check for mode
set "MODE=%~1"
if "%MODE%"=="" set "MODE=full"

:: Check if wrangler is installed
where wrangler >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [INFO] Installing Wrangler CLI...
    npm install -g wrangler
)

:: Check login
echo [INFO] Checking Cloudflare login...
wrangler whoami >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Not logged in to Cloudflare.
    echo Please run: wrangler login
    exit /b 1
)

echo [SUCCESS] Logged in to Cloudflare

:: Check git status
echo.
echo [INFO] Checking git status...
git status --short
if %ERRORLEVEL% equ 0 (
    echo.
    set /p CONTINUE="Continue with deployment? (y/n): "
    if /i "!CONTINUE!" neq "y" exit /b 0
)

:: Set account ID
set "CLOUDFLARE_ACCOUNT_ID=%ACCOUNT_ID%"

:: Deployment logic
if "%MODE%"=="full" goto UPDATE_FULL
if "%MODE%"=="backend" goto UPDATE_BACKEND
if "%MODE%"=="frontend" goto UPDATE_FRONTEND
if "%MODE%"=="migrate" goto MIGRATE_DATABASE
goto USAGE

:UPDATE_FULL
echo.
echo [INFO] Starting FULL update...
echo.

call :UPDATE_BACKEND
if %ERRORLEVEL% neq 0 exit /b 1

call :UPDATE_FRONTEND
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    UPDATE COMPLETE!                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Your MagicBox has been updated:
echo   🌐 https://%DOMAIN%
echo   🔌 https://%API_DOMAIN%
echo.
goto END

:UPDATE_BACKEND
echo.
echo ============================================
echo [INFO] Updating Backend...
echo ============================================
cd backend

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
)

echo [INFO] Running type check...
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Type check failed! Fix errors before deploying.
    cd ..
    exit /b 1
)

echo [INFO] Deploying to Cloudflare Workers...
wrangler deploy
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend deployment failed
    cd ..
    exit /b 1
)

echo [SUCCESS] Backend updated!
cd ..
exit /b 0

:UPDATE_FRONTEND
echo.
echo ============================================
echo [INFO] Updating Frontend...
echo ============================================
cd frontend

if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    npm install
)

echo [INFO] Running type check...
call npx tsc --noEmit
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Type check failed! Fix errors before deploying.
    cd ..
    exit /b 1
)

echo [INFO] Building...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Build failed
    cd ..
    exit /b 1
)

echo [INFO] Deploying to Cloudflare Pages...
npx wrangler pages deploy dist --project-name=magicbox-app
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend deployment failed
    cd ..
    exit /b 1
)

echo [SUCCESS] Frontend updated!
cd ..
exit /b 0

:MIGRATE_DATABASE
echo.
echo ============================================
echo [INFO] Applying Database Migrations...
echo ============================================
cd backend

echo [WARNING] This will modify your production database!
set /p CONFIRM="Are you sure? Type 'yes' to continue: "
if /i "!CONFIRM!" neq "yes" (
    echo Cancelled.
    cd ..
    exit /b 0
)

echo [INFO] Applying migrations...
wrangler d1 migrations apply magicbox-db --remote
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Migration failed
    cd ..
    exit /b 1
)

echo [SUCCESS] Migrations applied!
cd ..
exit /b 0

:USAGE
echo Usage: update.bat [full^|backend^|frontend^|migrate]
echo.
echo   full     - Update everything (default)
echo   backend  - Update API only
echo   frontend - Update web app only
echo   migrate  - Apply database migrations (manual confirmation)
echo.

:END
endlocal
