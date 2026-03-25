@echo off
echo Deploying to GitHub Pages...

REM Build the site
hugo

REM Enter public directory
cd public

REM Add changes
git add .

REM Commit changes
set msg=Update %date% %time%
if not "%*"=="" set msg=%*
git commit -m "%msg%"

REM Push to remote repository
git push origin master

REM Return to project root
cd ..

echo Deployment completed!
pause