#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

SKIP_BUILD=false
MSG_ARGS=()

for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=true ;;
    *) MSG_ARGS+=("$arg") ;;
  esac
done

if [ "$SKIP_BUILD" = false ]; then
  echo "========================================"
  echo "Build Hexo Site"
  echo "========================================"

  if ! command -v npm &> /dev/null; then
    echo "npm is not installed or not in PATH."
    exit 1
  fi

  if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install || { echo "npm install failed."; exit 1; }
  fi

  npm run build || { echo "Hexo build failed."; exit 1; }
fi

echo "========================================"
echo "Commit Source Changes"
echo "========================================"

# Commit message
if [ ${#MSG_ARGS[@]} -ge 1 ]; then
  msg="${MSG_ARGS[*]}"
else
  msg="Update site $(date '+%Y-%m-%d %H:%M:%S')"
fi

git add -A

if git diff --cached --quiet; then
  echo "No local changes to commit."
else
  git commit -m "$msg" || { echo "Git commit failed."; exit 1; }
fi

# Push
# Try direct push first, fall back to HTTP proxy (for SSH remotes, convert to HTTPS)
if git push origin main 2>/dev/null; then
  echo "========================================"
  echo "Done"
  echo "========================================"
  echo "Source pushed to origin/main."
  echo "GitHub Actions will deploy the generated site to mylvzi.github.io."
else
  echo "Direct Git push failed."
  echo "Checking local proxy http://127.0.0.1:7897 ..."

  if lsof -i :7897 -sTCP:LISTEN &>/dev/null; then
    echo "Retrying Git push via proxy 127.0.0.1:7897 ..."
    # Switch to HTTPS temporarily so http.proxy works
    SSH_URL=$(git remote get-url origin)
    git remote set-url origin https://github.com/mylvzi/my-blog.git
    if git -c http.proxy=http://127.0.0.1:7897 push origin main; then
      git remote set-url origin "$SSH_URL"
      echo "Push successful."
    else
      git remote set-url origin "$SSH_URL"
      echo "Git push failed via proxy."
      exit 1
    fi
  else
    echo "Git push failed, and local proxy 7897 is not available."
    exit 1
  fi

  echo "========================================"
  echo "Done"
  echo "========================================"
  echo "Source pushed to origin/main."
  echo "GitHub Actions will deploy the generated site to mylvzi.github.io."
fi
