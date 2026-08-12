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

# Push via SSH on port 443 (configured in ~/.ssh/config: ssh.github.com:443)
if git push origin main; then
  echo "========================================"
  echo "Done"
  echo "========================================"
  echo "Source pushed to origin/main."
  echo "GitHub Actions will deploy the generated site to mylvzi.github.io."
else
  echo "Git push failed."
  exit 1
fi
