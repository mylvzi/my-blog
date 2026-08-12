#!/usr/bin/env bash
#
# delete-post.sh — Delete a Hexo blog post by keyword (macOS version).
#
# Usage:
#   bash tools/delete-post.sh "关键词"
#   bash tools/delete-post.sh "关键词" --no-deploy --force
#
set -euo pipefail

# ── Help ──────────────────────────────────────────────
if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  echo "Usage: bash tools/delete-post.sh <keyword> [options]"
  echo ""
  echo "Options:"
  echo "  --no-deploy    Skip deployment, build only"
  echo "  --force        Skip confirmation prompt"
  exit 0
fi

# ── Parse arguments ───────────────────────────────────
QUERY=""
NO_DEPLOY=false
FORCE=false

while [ $# -gt 0 ]; do
  case "$1" in
    --no-deploy) NO_DEPLOY=true; shift ;;
    --force) FORCE=true; shift ;;
    -*) echo "Unknown option: $1"; exit 1 ;;
    *) QUERY="$1"; shift ;;
  esac
done

if [ -z "$QUERY" ]; then
  echo "ERROR: Search keyword is required."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/source/_posts"

if [ ! -d "$POSTS_DIR" ]; then
  echo "ERROR: Posts directory not found: $POSTS_DIR"
  exit 1
fi

echo "Searching for: $QUERY"
echo "========================================="

# Use Python to find matching posts
MATCH_RESULT=$(python3 - "$QUERY" "$POSTS_DIR" << 'PYEOF'
import sys, os, re

query = sys.argv[1].lower().replace('\\', '/')
posts_dir = sys.argv[2]

matches = []
for fname in sorted(os.listdir(posts_dir)):
    if not fname.endswith('.md'):
        continue
    fpath = os.path.join(posts_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract title from front matter
    title = ''
    fm_match = re.match(r'^---\s*\n(.*?)\n---', content, re.DOTALL)
    if fm_match:
        for line in fm_match.group(1).split('\n'):
            kv = re.match(r'^title:\s*(.*)', line)
            if kv:
                title = kv.group(1).strip().strip('"').strip("'")
                break

    if not title:
        title = fname.replace('.md', '')

    # Search in filename + title
    haystack = (fname + ' ' + title + ' ' + fpath).lower()
    if query in haystack:
        # Find associated image directories
        image_dirs = []
        for m in re.finditer(r'!\[[^\]]*\]\([^)]*images/posts/([^/)]+)/[^)]*\)', content, re.IGNORECASE):
            slug = m.group(1)
            img_dir = os.path.join(posts_dir, '..', 'images', 'posts', slug)
            img_dir = os.path.normpath(img_dir)
            if os.path.isdir(img_dir) and img_dir not in image_dirs:
                image_dirs.append(img_dir)

        matches.append({
            'path': fpath,
            'name': fname,
            'title': title,
            'image_dirs': image_dirs,
        })

if len(matches) == 0:
    print("COUNT=0")
elif len(matches) > 1:
    print(f"COUNT={len(matches)}")
    for i, m in enumerate(matches):
        print(f"MATCH_{i}_NAME={m['name']}")
        print(f"MATCH_{i}_TITLE={m['title']}")
else:
    m = matches[0]
    print("COUNT=1")
    print(f"POST_PATH={m['path']}")
    print(f"POST_NAME={m['name']}")
    print(f"POST_TITLE={m['title']}")
    for i, d in enumerate(m['image_dirs']):
        print(f"IMAGE_DIR_{i}={d}")
PYEOF
)

eval "$MATCH_RESULT"

if [ "${COUNT:-0}" -eq 0 ]; then
  echo "ERROR: No post matching: $QUERY"
  exit 1
fi

if [ "${COUNT:-0}" -gt 1 ]; then
  echo "Found multiple matching posts. Please use a more specific keyword:"
  for ((i=0; i<COUNT; i++)); do
    eval "name=\$MATCH_${i}_NAME"
    eval "title=\$MATCH_${i}_TITLE"
    echo "  [$((i+1))] $title  ->  $name"
  done
  echo "Operation aborted."
  exit 1
fi

# ── Single match ──────────────────────────────────────
echo ""
echo "Will delete post: $POST_TITLE"
echo "Post file       : $POST_PATH"

# Collect image dirs
IMAGE_DIRS=()
i=0
while true; do
  var_name="IMAGE_DIR_${i}"
  d="${!var_name:-}"
  [ -z "$d" ] && break
  IMAGE_DIRS+=("$d")
  ((i++))
done

if [ "${#IMAGE_DIRS[@]:-0}" -gt 0 ]; then
  echo "Image directories:"
  for d in "${IMAGE_DIRS[@]}"; do
    echo "  $d"
  done
else
  echo "Image directories: none"
fi

# ── Confirmation ──────────────────────────────────────
if [ "$FORCE" = false ]; then
  echo ""
  read -r -p "Type DELETE to confirm: " answer
  if [ "$answer" != "DELETE" ]; then
    echo "Cancelled."
    exit 0
  fi
fi

# ── Move to trash ─────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
TRASH_ROOT="$REPO_ROOT/.trash/deleted-posts/$TIMESTAMP"
mkdir -p "$TRASH_ROOT"

echo ""
echo "Backing up to: $TRASH_ROOT"

# Move post
RELATIVE_POST="${POST_PATH#$REPO_ROOT/}"
TRASH_POST="$TRASH_ROOT/$RELATIVE_POST"
mkdir -p "$(dirname "$TRASH_POST")"
mv "$POST_PATH" "$TRASH_POST"
echo "  -> $POST_NAME"

# Move image directories
if [ "${#IMAGE_DIRS[@]:-0}" -gt 0 ]; then
  for d in "${IMAGE_DIRS[@]}"; do
    if [ -d "$d" ]; then
      RELATIVE_IMG="${d#$REPO_ROOT/}"
      TRASH_IMG="$TRASH_ROOT/$RELATIVE_IMG"
      mkdir -p "$(dirname "$TRASH_IMG")"
      mv "$d" "$TRASH_IMG"
      echo "  -> $(basename "$d")/"
    fi
  done
fi

# ── Build ─────────────────────────────────────────────
echo ""
echo "===== Building Hexo ====="
cd "$REPO_ROOT"

BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?
echo "$BUILD_OUTPUT"

BUILD_ERRORS=$(echo "$BUILD_OUTPUT" | grep -iE "YAMLException|Process failed|FATAL" || true)
if [ $BUILD_EXIT -ne 0 ] || [ -n "$BUILD_ERRORS" ]; then
  echo "ERROR: Hexo build failed. Deleted files are in: $TRASH_ROOT"
  exit 1
fi

# ── Deploy ────────────────────────────────────────────
if [ "$NO_DEPLOY" = false ]; then
  echo ""
  echo "===== Deploying ====="
  bash "$REPO_ROOT/deploy.sh" --skip-build "delete: $POST_TITLE"
else
  echo ""
  echo "Deploy: SKIPPED (--no-deploy)"
fi

echo ""
echo "========================================="
echo "Deleted : $POST_TITLE"
echo "Backup  : $TRASH_ROOT"
if [ "$NO_DEPLOY" = false ]; then
  echo "Deploy  : Executed"
else
  echo "Deploy  : Skipped"
fi
echo "========================================="
