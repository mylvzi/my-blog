# PowerShell deployment script for Hugo blog

Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green

# Build the site
hugo

# Enter public directory
Set-Location public

# Add changes
git add .

# Commit changes
$msg = "Update $(Get-Date)"
if ($args.Count -gt 0) {
    $msg = $args -join " "
}
git commit -m $msg

# Push to remote repository
git push origin master

# Return to project root
Set-Location ..

Write-Host "Deployment completed!" -ForegroundColor Green