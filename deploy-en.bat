@echo off
echo ========================================
echo   Deploying to GitHub Pages (gh-pages)
echo ========================================

REM Check if hugo is available
where hugo >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Hugo not found in PATH
    echo Please install Hugo first: https://gohugo.io/installation/
    pause
    exit /b 1
)

REM Build the site
echo Building site with Hugo...
hugo --cleanDestinationDir
if %ERRORLEVEL% neq 0 (
    echo ERROR: Hugo build failed
    pause
    exit /b 1
)
echo Hugo build successful.

REM Check if public directory exists
if not exist "public\" (
    echo ERROR: public directory not found
    echo Hugo build may have failed
    pause
    exit /b 1
)

REM Enter public directory
cd public

REM Initialize git repository if not exists
if not exist ".git" (
    echo Initializing git repository in public directory...
    git init
    git remote add origin https://github.com/mylvzi/my-blog.git
    git checkout -b gh-pages
    echo NOTE: New repository initialized, first push may need manual setup
)

REM Check remote URL
git remote -v | findstr "origin" >nul
if %ERRORLEVEL% neq 0 (
    echo Setting remote origin...
    git remote add origin https://github.com/mylvzi/my-blog.git
)

REM Pull latest changes from remote (avoid conflicts)
echo Pulling latest changes from remote...
git pull origin gh-pages --rebase --autostash 2>nul
if %ERRORLEVEL% neq 0 (
    echo No existing remote branch or pull failed, continuing...
)

REM Add all changes
echo Adding changes...
git add .

REM Commit changes
set msg=Update site %date% %time%
if not "%*"=="" set msg=%*
echo Committing with message: %msg%
git commit -m "%msg%"
if %ERRORLEVEL% neq 0 (
    echo No changes to commit
    echo Deployment completed (no changes)
    pause
    exit /b 0
)

REM Push to remote repository
echo Pushing to origin/gh-pages...
git push origin gh-pages
if %ERRORLEVEL% neq 0 (
    echo Push failed, trying with --set-upstream...
    git push --set-upstream origin gh-pages
)

REM Return to project root
cd ..

echo ========================================
echo   Deployment completed successfully!
echo ========================================
echo.
echo Your site should be available at:
echo   https://mylvzi.github.io/
echo.
pause