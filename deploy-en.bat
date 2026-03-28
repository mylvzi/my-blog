@echo off
echo Deploying to GitHub Pages...

REM Build the site
hugo

REM Enter public directory
cd public

REM Initialize git repository if not exists
if not exist ".git" (
    echo Initializing git repository in public directory...
    git init
    git remote add origin https://github.com/mylvzi/my-blog.git
    git checkout -b gh-pages
)

REM Add changes
git add .

REM Commit changes
set msg=Update %date% %time%
if not "%*"=="" set msg=%*
git commit -m "%msg%"

REM Push to remote repository
git push origin gh-pages --force

REM Return to project root
cd ..

echo Deployment completed!
pause