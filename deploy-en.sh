#!/bin/bash

echo -e "\033[0;32mDeploying to GitHub Pages...\033[0m"

# Build the site
hugo

# Enter public directory
cd public

# Add changes
git add .

# Commit changes
msg="Update $(date)"
if [ -n "$*" ]; then
    msg="$*"
fi
git commit -m "$msg"

# Push to remote repository
git push origin master

# Return to project root
cd ..

echo -e "\033[0;32mDeployment completed!\033[0m"