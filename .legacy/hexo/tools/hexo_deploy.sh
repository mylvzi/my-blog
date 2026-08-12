#!/usr/bin/env bash
# Hexo deploy script — called by "npm run deploy"
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"
bash "$REPO_ROOT/deploy.sh" "$@"
