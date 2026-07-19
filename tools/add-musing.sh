#!/usr/bin/env bash
#
# add-musing.sh — Add a new entry to the 碎碎念 (musing) page.
#
# Usage:
#   bash tools/add-musing.sh "今天的内容..."
#   bash tools/add-musing.sh "内容" --no-deploy
#
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "Usage: bash tools/add-musing.sh <content> [options]"
  echo ""
  echo "Options:"
  echo "  --no-deploy    Skip deployment, build only"
  echo ""
  echo "Example:"
  echo '  bash tools/add-musing.sh "今天学到了一个有趣的 CSS 技巧..."'
  echo '  bash tools/add-musing.sh "内容" --no-deploy'
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MUSING_FILE="$REPO_ROOT/source/_data/musings.json"

# Ensure data file exists
if [ ! -f "$MUSING_FILE" ]; then
  echo '[]' > "$MUSING_FILE"
fi

# Parse args
CONTENT=""
NO_DEPLOY=false

while [ $# -gt 0 ]; do
  case "$1" in
    --no-deploy) NO_DEPLOY=true; shift ;;
    -*) echo "Unknown option: $1"; exit 1 ;;
    *) CONTENT="$1"; shift ;;
  esac
done

if [ -z "$CONTENT" ]; then
  echo "ERROR: Content is required."
  echo 'Usage: bash tools/add-musing.sh "your musing content..."'
  exit 1
fi

TODAY=$(date '+%Y-%m-%d')

echo "========================================="
echo "Adding Musing"
echo "Date: $TODAY"
echo "========================================="

# Use Python to insert the new entry into the JSON file
RESULT=$(python3 - "$MUSING_FILE" "$TODAY" "$CONTENT" 2>&1 << 'PYEOF'
import sys, json

filepath = sys.argv[1]
today = sys.argv[2]
content = sys.argv[3]

with open(filepath, 'r', encoding='utf-8') as f:
    try:
        musings = json.load(f)
    except:
        musings = []

# Check for duplicate
for m in musings:
    if m.get('date') == today and m.get('content', '').strip() == content.strip():
        print("DUPLICATE")
        sys.exit(0)

# Prepend new entry (newest first)
musings.insert(0, {"date": today, "content": content})

with open(filepath, 'w', encoding='utf-8') as f:
    json.dump(musings, f, indent=2, ensure_ascii=False)

print("OK")
PYEOF
)

if [ "$RESULT" = "DUPLICATE" ]; then
  echo ""
  echo "⚠️  This exact musing already exists for today. Skipped."
  exit 0
fi

echo "$RESULT"

echo ""
echo "Musing added to source/_data/musings.json"
echo "Content: $CONTENT"

# ── Build ─────────────────────────────────────────────
echo ""
echo "===== Building Hexo ====="
cd "$REPO_ROOT"
npm run build || { echo "Build failed."; exit 1; }
echo "Build successful."

# ── Deploy ────────────────────────────────────────────
if [ "$NO_DEPLOY" = false ]; then
  echo ""
  echo "===== Deploying ====="
  bash "$REPO_ROOT/deploy.sh" --skip-build "musing: $TODAY"
else
  echo ""
  echo "Deploy: SKIPPED (--no-deploy)"
fi

echo ""
echo "Done! View at: https://mylvzi.github.io/musing/"
