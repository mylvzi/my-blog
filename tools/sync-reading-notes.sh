#!/usr/bin/env bash
#
# sync-reading-notes.sh — Sync reading notes to Hexo blog (macOS version).
#
# Usage:
#   bash tools/sync-reading-notes.sh
#   READING_SOURCE_DIR=/custom/path bash tools/sync-reading-notes.sh
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POSTS_DIR="$REPO_ROOT/source/_posts"

READING_SOURCE_DIR="${READING_SOURCE_DIR:-/Volumes/KINGSTON/lsq_learn/阅读思考合集}"
TRACKER_FILE="$REPO_ROOT/.reading-notes-tracker.json"

if [ ! -d "$READING_SOURCE_DIR" ]; then
  echo "ERROR: Reading source directory not found: $READING_SOURCE_DIR"
  echo "Set READING_SOURCE_DIR env var to override."
  exit 1
fi

echo "========================================="
echo "Syncing Reading Notes"
echo "Source : $READING_SOURCE_DIR"
echo "========================================="

# Run Python once — status to stderr, results to stdout
RESULT=$(python3 - "$READING_SOURCE_DIR" "$POSTS_DIR" "$TRACKER_FILE" 2>&1 << 'PYEOF'
import sys, os, re, json, hashlib

source_dir = sys.argv[1]
posts_dir = sys.argv[2]
tracker_file = sys.argv[3]

tracker = {}
if os.path.exists(tracker_file):
    try:
        with open(tracker_file, 'r', encoding='utf-8') as f:
            tracker = json.load(f)
    except:
        pass

imported = 0
updated = 0
skipped = 0
has_changes = False

FM = '''---
title: "{display}"
date: {date}
permalink: reading/{date}/
reading_note: true
tags:
  - 阅读笔记
comment: true
---

'''

for month_dir in sorted(os.listdir(source_dir)):
    month_path = os.path.join(source_dir, month_dir)
    if not os.path.isdir(month_path):
        continue

    for fname in sorted(os.listdir(month_path)):
        if not fname.endswith('.md'):
            continue

        sp = os.path.join(month_path, fname)
        rk = os.path.relpath(sp, source_dir)

        with open(sp, 'rb') as fh:
            ch = hashlib.sha256(fh.read()).hexdigest()

        is_mod = rk in tracker and tracker[rk] != ch

        bn = fname.replace('.md', '')
        ps = bn.split('-')
        if len(ps) < 3:
            print(f"SKIP (bad filename): {rk}", file=sys.stderr)
            continue

        try:
            df = f"{ps[0]}-{int(ps[1]):02d}-{int(ps[2]):02d}"
        except:
            print(f"SKIP (bad date): {rk}", file=sys.stderr)
            continue

        with open(sp, 'r', encoding='utf-8') as fh:
            rc = fh.read()

        if not rc.strip():
            print(f"SKIP (empty): {rk}", file=sys.stderr)
            skipped += 1
            continue

        body = rc
        fm_match = re.match(r'^---\s*\n.*?\n---\s*\n', body, re.DOTALL)
        if fm_match:
            body = body[fm_match.end():]
        body_c = re.sub(r'\s+', ' ', body).strip()

        if not body_c:
            print(f"SKIP (empty body): {rk}", file=sys.stderr)
            skipped += 1
            continue

        pf = f"{df}-reading-note.md"
        pp = os.path.join(posts_dir, pf)

        if os.path.exists(pp):
            with open(pp, 'r', encoding='utf-8') as fh:
                ec = fh.read()
            eb = ec
            efm = re.match(r'^---\s*\n.*?\n---\s*\n', eb, re.DOTALL)
            if efm:
                eb = eb[efm.end():]
            eb_c = re.sub(r'\s+', ' ', eb).strip()

            if eb_c == body_c:
                print(f"SKIP (unchanged): {rk}", file=sys.stderr)
                skipped += 1
                tracker[rk] = ch
                continue
            is_mod = True

        display = bn
        with open(pp, 'w', encoding='utf-8') as fh:
            fh.write(FM.format(display=display, date=df) + rc.strip() + '\n')

        tracker[rk] = ch
        has_changes = True

        if is_mod:
            print(f"UPDATED: {rk} -> {pf}", file=sys.stderr)
            updated += 1
        else:
            print(f"IMPORTED: {rk} -> {pf}", file=sys.stderr)
            imported += 1

with open(tracker_file, 'w', encoding='utf-8') as fh:
    json.dump(tracker, fh, indent=2, ensure_ascii=False)

# Output key=value to stdout for bash parsing
print(f"IMPORTED={imported}")
print(f"UPDATED={updated}")
print(f"SKIPPED={skipped}")
print(f"HAS_CHANGES={'true' if has_changes else 'false'}")
PYEOF
)

# Extract status lines (stderr captured in stdout) — show them
echo "$RESULT" | grep -v '^[A-Z_]*=' || true
echo ""

# Parse key=value lines
IMPORTED=$(echo "$RESULT" | grep '^IMPORTED=' | cut -d= -f2)
UPDATED=$(echo "$RESULT" | grep '^UPDATED=' | cut -d= -f2)
SKIPPED=$(echo "$RESULT" | grep '^SKIPPED=' | cut -d= -f2)
HAS_CHANGES=$(echo "$RESULT" | grep '^HAS_CHANGES=' | cut -d= -f2)

# ── Summary ───────────────────────────────────────────
echo "===== Sync Summary ====="
echo "Imported: $IMPORTED"
echo "Updated : $UPDATED"
echo "Skipped : $SKIPPED"

if [ "$HAS_CHANGES" = false ]; then
  echo "No new or updated notes. Done."
  exit 0
fi

# ── Build ─────────────────────────────────────────────
echo ""
echo "===== Building Hexo ====="
cd "$REPO_ROOT"
npm run build || { echo "Build failed, skipping deploy."; exit 1; }

# ── Deploy ────────────────────────────────────────────
echo ""
echo "===== Deploying ====="
bash "$REPO_ROOT/deploy.sh" --skip-build "sync: reading notes $(date '+%Y-%m-%d')"
echo ""
echo "Deploy complete."
