#!/usr/bin/env bash
#
# publish-post.sh — Publish a Markdown note to the Hexo blog (macOS version).
#
# Usage:
#   bash tools/publish-post.sh "path/to/note.md" -c "技术" -t "Java,算法"
#   bash tools/publish-post.sh "path/to/note.md" --no-deploy
#
set -euo pipefail

# ── Help ──────────────────────────────────────────────
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "Usage: bash tools/publish-post.sh <input.md> [options]"
  echo ""
  echo "Options:"
  echo "  -c, --category CAT     Article category (default: 教程分享)"
  echo "  -t, --tags TAGS        Tags, comma-separated (default: 教程分享)"
  echo "  -s, --slug SLUG        URL slug (auto-generated if omitted)"
  echo "  -d, --date DATE        Publish date, format: yyyy-MM-dd HH:mm:ss (default: now)"
  echo "  --no-deploy            Skip deployment, build only"
  echo "  --restart-server       Restart local preview server and open browser"
  exit 0
fi

# ── Parse arguments ───────────────────────────────────
INPUT_PATH=""
CATEGORY="教程分享"
TAGS="教程分享"
SLUG=""
DATE=""
NO_DEPLOY=false
RESTART_SERVER=false

while [ $# -gt 0 ]; do
  case "$1" in
    -c|--category) CATEGORY="$2"; shift 2 ;;
    -t|--tags) TAGS="$2"; shift 2 ;;
    -s|--slug) SLUG="$2"; shift 2 ;;
    -d|--date) DATE="$2"; shift 2 ;;
    --no-deploy) NO_DEPLOY=true; shift ;;
    --restart-server) RESTART_SERVER=true; shift ;;
    -*) echo "Unknown option: $1"; exit 1 ;;
    *) INPUT_PATH="$1"; shift ;;
  esac
done

# ── Validation ────────────────────────────────────────
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/source/_posts"

if [ -z "$INPUT_PATH" ]; then
  echo "ERROR: Input path is required."
  exit 1
fi
if [ ! -f "$INPUT_PATH" ]; then
  echo "ERROR: File not found: $INPUT_PATH"
  exit 1
fi
if [ ! -d "$POSTS_DIR" ]; then
  echo "ERROR: Posts directory not found: $POSTS_DIR"
  exit 1
fi

# Resolve absolute path
INPUT_PATH="$(cd "$(dirname "$INPUT_PATH")" 2>/dev/null && pwd)/$(basename "$INPUT_PATH")"
FILENAME=$(basename "$INPUT_PATH")

if [ -z "$DATE" ]; then
  DATE=$(date '+%Y-%m-%d %H:%M:%S')
fi

echo "========================================="
echo "Publishing: $FILENAME"
echo "Category : $CATEGORY"
echo "Tags     : $TAGS"
echo "Date     : $DATE"
echo "========================================="

# Use Python to process the file — much more robust for text manipulation
PYTHON_OUTPUT=$(python3 - "$INPUT_PATH" "$POSTS_DIR" "$FILENAME" "$CATEGORY" "$TAGS" "$SLUG" "$DATE" << 'PYEOF'
import sys, os, re

input_path = sys.argv[1]
posts_dir = sys.argv[2]
filename = sys.argv[3]
category = sys.argv[4]
tags_str = sys.argv[5]
slug = sys.argv[6]
date = sys.argv[7]

# Read source content
with open(input_path, 'r', encoding='utf-8') as f:
    source_text = f.read()

# Parse front matter
fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', source_text, re.DOTALL)
front_matter = {}
body = source_text
if fm_match:
    body = source_text[fm_match.end():]
    fm_text = fm_match.group(1)
    for line in fm_text.split('\n'):
        kv = re.match(r'^(\w+):\s*(.*)', line)
        if kv:
            key = kv.group(1)
            val = kv.group(2).strip().strip('"').strip("'")
            front_matter[key] = val

# Determine title
title = front_matter.get('title', '')
if not title:
    title = os.path.splitext(filename)[0]

# Determine summary
summary = front_matter.get('summary', '')
if not summary:
    # Generate from body
    clean = body.strip()
    # Remove code blocks
    clean = re.sub(r'```.*?```', ' ', clean, flags=re.DOTALL)
    # Remove images
    clean = re.sub(r'!\[\[[^\]]+\]\]', ' ', clean)
    clean = re.sub(r'!\[[^\]]*\]\([^)]+\)', ' ', clean)
    # Remove links
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', ' ', clean)
    # Remove markdown symbols
    clean = re.sub(r'[>#*_`\-]', ' ', clean)
    # Collapse whitespace
    clean = re.sub(r'\s+', ' ', clean).strip()
    if len(clean) > 100:
        clean = clean[:100] + '...'
    summary = clean

# Determine slug
if not slug:
    # ASCII transliteration
    import unicodedata
    ascii_title = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    slug = re.sub(r'[^a-z0-9]+', '-', ascii_title.lower()).strip('-')
    if not slug:
        import hashlib
        slug = 'post-' + hashlib.sha1(title.encode()).hexdigest()[:8]

# Print results for bash to capture
print(f"TITLE={title}")
print(f"SLUG={slug}")
print(f"SUMMARY={summary}")
print(f"HAS_OBSIDIAN_IMAGES={'![[' in source_text}")

# Build new front matter
tags_list = [t.strip() for t in tags_str.split(',') if t.strip()]
if not tags_list:
    tags_list = ['教程分享']

fm_lines = ['---']
fm_lines.append(f'title: "{title}"')
fm_lines.append(f'date: {date}')
fm_lines.append('tags:')
for t in tags_list:
    fm_lines.append(f'  - "{t}"')
fm_lines.append('categories:')
fm_lines.append(f'  - "{category}"')
fm_lines.append('comment: true')
fm_lines.append(f'summary: "{summary}"')
fm_lines.append('---')
fm_lines.append('')

new_content = '\n'.join(fm_lines) + body.strip() + '\n'

# Write to posts directory
post_path = os.path.join(posts_dir, filename)
with open(post_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"POST_PATH={post_path}")
PYEOF
)

# Parse Python output
eval "$PYTHON_OUTPUT" 2>/dev/null || {
  echo "ERROR: Failed to process file with Python"
  exit 1
}

echo "Title    : $TITLE"
echo "Slug     : $SLUG"
echo ""

echo "Post written to: source/_posts/$FILENAME"

# Warning for Obsidian images
if [ "${HAS_OBSIDIAN_IMAGES:-false}" = "True" ]; then
  echo ""
  echo "⚠️  Warning: Obsidian image syntax (![[...]]) detected."
  echo "   These may not render correctly on the blog."
fi

# ── Build ─────────────────────────────────────────────
echo ""
echo "===== Building Hexo ====="
cd "$REPO_ROOT"

BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?
echo "$BUILD_OUTPUT"

# Check for real build failures (ignore Script load errors from hexo's scripts/ dir)
BUILD_ERRORS=$(echo "$BUILD_OUTPUT" | grep -iE "YAMLException|Process failed|FATAL" || true)
if [ $BUILD_EXIT -ne 0 ] || [ -n "$BUILD_ERRORS" ]; then
  echo "ERROR: Hexo build failed."
  echo "$BUILD_ERRORS"
  exit 1
fi

echo "Build successful."

# ── Restart server if requested ───────────────────────
if [ "$RESTART_SERVER" = true ]; then
  echo ""
  echo "===== Restarting Preview Server ====="
  lsof -ti :4000 | xargs kill -9 2>/dev/null || true
  sleep 2
  nohup npm run start > "$REPO_ROOT/.hexo-server.log" 2>&1 &
  sleep 5
  open "http://localhost:4000" 2>/dev/null || true
  echo "Server started at http://localhost:4000"
fi

# ── Deploy ────────────────────────────────────────────
if [ "$NO_DEPLOY" = false ]; then
  echo ""
  echo "===== Deploying ====="
  bash "$REPO_ROOT/deploy.sh" --skip-build "publish: $TITLE"
else
  echo ""
  echo "Deploy: SKIPPED (--no-deploy)"
fi

echo ""
echo "========================================="
echo "Complete: $TITLE"
echo "Post   : source/_posts/$FILENAME"
echo "Slug   : $SLUG"
if [ "$NO_DEPLOY" = false ]; then
  echo "Deploy : Executed"
else
  echo "Deploy : Skipped"
fi
echo "========================================="
