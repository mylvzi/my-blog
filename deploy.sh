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
    echo "Retrying Git push via http://127.0.0.1:7897 ..."
    git -c http.proxy=http://127.0.0.1:7897 push origin main || {
      echo "Git push failed via local proxy."
      exit 1
    }
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
