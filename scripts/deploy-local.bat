@echo off
REM Local Deploy Script for Windows
REM Run this locally to deploy changes to production server

echo.
echo ╔════════════════════════════════════════════════╗
echo ║   Local → Production Deploy (Windows)          ║
echo ╚════════════════════════════════════════════════╝
echo.

REM Configuration
set SERVER_USER=root
set SERVER_HOST=YOUR_SERVER_IP
set PROJECT_DIR=/var/www/notvarmi

REM Check for uncommitted changes
git status -s > nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git repository değil
    pause
    exit /b 1
)

echo [*] Checking for uncommitted changes...
for /f %%i in ('git status -s') do (
    echo [!] Uncommitted changes bulundu!
    git status -s
    echo.
    choice /C YN /M "Devam etmek istiyor musunuz"
    if errorlevel 2 exit /b 0
    goto :push
)

:push
REM Get current branch
for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%a
echo [*] Current branch: %CURRENT_BRANCH%
echo.

REM Push to GitHub
echo [*] Pushing to GitHub...
git push origin %CURRENT_BRANCH%
if %errorlevel% neq 0 (
    echo [X] Git push başarısız!
    pause
    exit /b 1
)
echo [OK] Code pushed to GitHub
echo.

REM SSH to server and deploy
echo [*] Deploying to production server...
ssh %SERVER_USER%@%SERVER_HOST% "cd %PROJECT_DIR% && ./scripts/update.sh"

if %errorlevel% equ 0 (
    echo.
    echo ╔════════════════════════════════════════════════╗
    echo ║          ✨ Deploy Başarılı! ✨                ║
    echo ╚════════════════════════════════════════════════╝
    echo.
    echo [OK] Deployment tamamlandı!
    echo [i] Site: https://www.notvarmi.com
) else (
    echo.
    echo [X] Deployment başarısız!
    echo [i] Sunucu loglarını kontrol edin
)

pause
