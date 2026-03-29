@echo off
echo ========================================
echo(Deploying to GitHub Pages (master)
echo ========================================

hugo --cleanDestinationDir || (
    echo Hugo build failed
    pause
    exit /b 1
)

cd public || (
    echo public directory not found
    pause
    exit /b 1
)

git add .
set msg=Update site %date% %time%
if not "%*"=="" set msg=%*
git commit -m "%msg%"
git push origin master

cd ..

echo Current dir:
cd

echo ========================================
echo Done
echo ========================================
pause