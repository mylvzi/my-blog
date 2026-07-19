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
MUSING_FILE="$REPO_ROOT/source/musing/index.md"

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

# Use Python to insert the new entry after the front matter
RESULT=$(python3 - "$MUSING_FILE" "$TODAY" "$CONTENT" 2>&1 << 'PYEOF'
import sys, re

filepath = sys.argv[1]
today = sys.argv[2]
content = sys.argv[3]

with open(filepath, 'r', encoding='utf-8') as f:
    original = f.read()

# Check for duplicate: same date + same content already exists
if f"## {today}" in original:
    # Extract existing entries for today
    pattern = rf'## {re.escape(today)}\n\n(.*?)\n\n---'
    existing = re.findall(pattern, original, re.DOTALL)
    if content.strip() in [e.strip() for e in existing]:
        print("DUPLICATE")
        sys.exit(0)

fm_match = re.match(r'(^---\s*\n.*?\n---\s*\n)', original, re.DOTALL)
if not fm_match:
    print("ERROR: No front matter found in musing page.", file=sys.stderr)
    sys.exit(1)

front_matter = fm_match.group(1)
rest = original[fm_match.end():].lstrip('\n')

entry = f"""## {today}

{content}

---

"""

new_content = front_matter + '\n' + entry + rest

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

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
echo "Musing added to source/musing/index.md"
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
