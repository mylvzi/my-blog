@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0" || (
    echo Failed to enter project directory.
    pause
    exit /b 1
)

echo ========================================
echo Build Hexo Site
echo ========================================

where npm >nul 2>nul || (
    echo npm is not installed or not in PATH.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install || (
        echo npm install failed.
        pause
        exit /b 1
    )
)

call npm run build || (
    echo Hexo build failed.
    pause
    exit /b 1
)

echo ========================================
echo Commit Source Changes
echo ========================================

set "msg=Update site %date% %time%"
if not "%~1"=="" set "msg=%*"

git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%msg%" || (
        echo Git commit failed.
        pause
        exit /b 1
    )
) else (
    echo No local changes to commit.
)

git push origin main
if errorlevel 1 (
    echo Direct Git push failed.
    echo Checking local proxy http://127.0.0.1:7897 ...
    powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 7897 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
    if errorlevel 1 (
        echo Git push failed, and local proxy 7897 is not available.
        pause
        exit /b 1
    )

    echo Retrying Git push via http://127.0.0.1:7897 ...
    git -c http.proxy=http://127.0.0.1:7897 push origin main || (
        echo Git push failed via local proxy.
        pause
        exit /b 1
    )
)

echo ========================================
echo Done
echo ========================================
echo Source pushed to origin/main.
echo GitHub Actions will deploy the generated site to mylvzi.github.io.
pause
