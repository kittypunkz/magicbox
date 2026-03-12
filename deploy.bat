@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: MagicBox Deployment Script for magicbox.bankapirak.com (Windows)
:: Usage: deploy.bat [full|backend|frontend]

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
echo ║       MagicBox Deployment - magicbox.bankapirak.com        ║
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

:: Deployment logic
if "%MODE%"=="full" goto FULL_DEPLOY
if "%MODE%"=="backend" goto DEPLOY_BACKEND
if "%MODE%"=="frontend" goto DEPLOY_FRONTEND
goto USAGE

:FULL_DEPLOY
echo.
echo [INFO] Starting FULL deployment...
echo.

call :CREATE_DATABASE
if %ERRORLEVEL% neq 0 exit /b 1

call :DEPLOY_BACKEND
if %ERRORLEVEL% neq 0 exit /b 1

call :DEPLOY_FRONTEND
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                  DEPLOYMENT COMPLETE!                      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Your MagicBox is live at:
echo   🌐 https://%DOMAIN%
echo   🔌 https://%API_DOMAIN%
echo.
goto END

:CREATE_DATABASE
echo [INFO] Checking D1 Database...
cd backend

:: Check if database exists
wrangler d1 list | findstr "magicbox-db" >nul
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Database 'magicbox-db' already exists
    cd ..
    exit /b 0
)

echo [INFO] Creating D1 Database 'magicbox-db'...
wrangler d1 create magicbox-db > db_output.txt 2>&1

:: Extract database ID
for /f "tokens=*" %%a in ('findstr /R "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" db_output.txt') do (
    set "DB_ID=%%a"
)
del db_output.txt

if "!DB_ID!"=="" (
    echo [ERROR] Failed to create database or extract ID
    cd ..
    exit /b 1
)

echo [SUCCESS] Database created with ID: !DB_ID!

:: Update wrangler.toml
powershell -Command "(Get-Content wrangler.toml) -replace 'database_id = \"\"', 'database_id = \"!DB_ID!\"' | Set-Content wrangler.toml"

:: Initialize schema
echo [INFO] Initializing database schema...
wrangler d1 execute magicbox-db --remote --file=..\database\schema.sql
if %ERRORLEVEL% neq 0 (
    echo [WARNING] Schema initialization may have failed, continuing anyway...
)

cd ..
echo [SUCCESS] Database setup complete
exit /b 0

:DEPLOY_BACKEND
echo.
echo [INFO] Deploying Backend to %API_DOMAIN%...
cd backend

if not exist "node_modules" (
    echo [INFO] Installing backend dependencies...
    npm install
)

echo [INFO] Deploying Worker...
wrangler deploy
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backend deployment failed
    cd ..
    exit /b 1
)

echo [SUCCESS] Backend deployed to: https://%API_DOMAIN%
cd ..
exit /b 0

:DEPLOY_FRONTEND
echo.
echo [INFO] Deploying Frontend to %DOMAIN%...
cd frontend

if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    npm install
)

echo [INFO] Building frontend...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed
    cd ..
    exit /b 1
)

echo [INFO] Deploying to Pages...
npx wrangler pages deploy dist --project-name=magicbox-app
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend deployment failed
    cd ..
    exit /b 1
)

echo [SUCCESS] Frontend deployed to: https://%DOMAIN%
cd ..
exit /b 0

:USAGE
echo Usage: deploy.bat [full^|backend^|frontend]
echo.
echo   full     - Deploy everything (default)
echo   backend  - Deploy API only
echo   frontend - Deploy web app only
echo.

:END
endlocal
