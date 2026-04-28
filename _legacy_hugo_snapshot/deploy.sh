#!/bin/bash

echo -e "\033[0;36m========================================\033[0m"
echo -e "\033[0;36m  Deploying to GitHub Pages (master)\033[0m"
echo -e "\033[0;36m========================================\033[0m"

# Check if hugo is available
if ! command -v hugo &> /dev/null; then
    echo -e "\033[0;31mERROR: Hugo not found in PATH\033[0m"
    echo "Please install Hugo first: https://gohugo.io/installation/"
    exit 1
fi

# Build the site
echo "Building site with Hugo..."
hugo --cleanDestinationDir
if [ $? -ne 0 ]; then
    echo -e "\033[0;31mERROR: Hugo build failed\033[0m"
    exit 1
fi
echo -e "\033[0;32mHugo build successful.\033[0m"

# Check if public directory exists
if [ ! -d "public" ]; then
    echo -e "\033[0;31mERROR: public directory not found\033[0m"
    echo "Hugo build may have failed"
    exit 1
fi

# Enter public directory
cd public

# Initialize git repository if not exists
if [ ! -d ".git" ]; then
    echo "Initializing git repository in public directory..."
    git init
    git remote add origin https://github.com/mylvzi/mylvzi.github.io.git
    git checkout -b master
    echo -e "\033[0;33mNOTE: New repository initialized, first push may need manual setup\033[0m"
fi

# Ensure we're on master branch
echo "Ensuring we're on master branch..."
if git branch --list master | grep -q master; then
    # master branch exists, check if we're on it
    if [ "$(git symbolic-ref --short HEAD)" != "master" ]; then
        echo "Switching to master branch..."
        git checkout master
    fi
else
    echo "Creating master branch..."
    git checkout -b master
fi

# Check remote URL
if ! git remote | grep -q "origin"; then
    echo "Setting remote origin..."
    git remote add origin https://github.com/mylvzi/mylvzi.github.io.git
fi

# Pull latest changes from remote (avoid conflicts)
echo "Pulling latest changes from remote..."
git pull origin master --rebase --autostash 2>/dev/null
if [ $? -ne 0 ]; then
    echo "No existing remote branch or pull failed, continuing..."
fi

# Add all changes
echo "Adding changes..."
git add .

# Commit changes
msg="Update site $(date)"
if [ -n "$*" ]; then
    msg="$*"
fi
echo "Committing with message: $msg"
git commit -m "$msg"
if [ $? -ne 0 ]; then
    echo "No changes to commit"
    echo -e "\033[0;33mDeployment completed (no changes)\033[0m"
    exit 0
fi

# Push to remote repository
echo "Pushing to origin/master..."
git push origin master --force
if [ $? -ne 0 ]; then
    echo "Push failed, trying with --set-upstream..."
    git push --set-upstream origin master --force
fi

# Return to project root
cd ..

echo -e "\033[0;36m========================================\033[0m"
echo -e "\033[0;32m  Deployment completed successfully!\033[0m"
echo -e "\033[0;36m========================================\033[0m"
echo
echo "Your site should be available at:"
echo "  https://mylvzi.github.io/"
echo