# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Hexo v6.3.0 static blog. Source code lives on the `main` branch; GitHub Actions auto-deploys the generated site to `mylvzi.github.io` (master branch) via `hexo-deployer-git`.

Theme: **stellar** (`hexo-theme-stellar` v1.29.x). Config split across `_config.yml` (Hexo core) and `_config.stellar.yml` (theme).

## Common commands

```bash
npm install                    # Install dependencies (first time / after package changes)
npm run build                  # hexo clean && hexo generate — use before pushing to verify
npm run start                  # hexo clean && hexo server -l -p 4000 — local preview
.\deploy.bat "commit message"  # Build + commit all + push to origin/main (GH Actions deploys)
npm run deploy                 # Runs scripts/hexo_deploy.sh (alternative deploy path)
```

## Creating and managing posts

**New posts from a local Markdown file (recommended):**
```powershell
pwsh -ExecutionPolicy Bypass -File .\tools\publish-obsidian-post.ps1 "C:\path\to\file.md" -Category "技术" -Tags "Java,算法" -Slug "my-slug"
```
The script copies the file into `source/_posts/`, fixes front matter, handles image references, builds, and optionally deploys. `-NoDeploy` skips the push step. `-RestartServer` restarts the local preview afterward.

**Delete a post:**
```powershell
pwsh -ExecutionPolicy Bypass -File .\tools\delete-blog-post.ps1 "keyword"
```
Matches by title/filename keyword, moves post + images to `.trash/`, rebuilds, deploys. Use `-NoDeploy` to skip push, `-Force` to skip confirmation.

**Manual post creation:**
```bash
hexo new post "Title"      # Creates source/_posts/YYYY-MM-DD-title.md from scaffolds/post.md
hexo new draft "Title"     # Creates source/_drafts/title.md
hexo publish post "Title"  # Publishes a draft
```

## Architecture

### Content structure
```
source/
  _posts/                  # All blog posts (*.md), named YYYY-MM-DD-slug.md
  _data/widgets.yml        # Sidebar widgets (welcome card with profile + links)
  images/posts/<slug>/     # Per-post image directories, referenced as /images/posts/<slug>/img_01.png
  images/avatar.png        # Site avatar
  images/projects/         # Project showcase images
  js/                      # Custom frontend JS (theme-toggle, blog-effects, blog-runtime, music-player)
  css/theme-toggle.css     # Dark/light theme styles
  about/index.md           # About page (menu_id: about)
  prompts/index.md         # Prompt collection page
  projects/index.md        # Projects page
  categories/index.md      # Categories listing
  tags/index.md            # Tags listing
  music/                   # Music files for the player
```

### Custom Hexo scripts (`scripts/`)
These run during `hexo generate` as Hexo filters:

- **`polish-homepage.js`** — Post-generate HTML filter. Enhances homepage post cards with topic badges, icons, tag chips, reading time, and custom summaries. Matches posts to topics via title/tag heuristics.
- **`fix-recent-widget-order.js`** — Post-generate filter. Overwrites the "recent posts" sidebar widget with correctly sorted (by date, descending) post links in every generated HTML file.
- **`footer-stats.js`** — Post-render HTML filter. Injects blog statistics (article count, total word count, runtime counter, visitor counts from busuanzi) into the page footer.

### GitHub Actions (`.github/workflows/deploy.yml`)
Triggered on push to `main`. Sets up SSH via `HEXO_DEPLOY_PRI_B64` secret, runs `hexo clean && hexo d` which pushes the built site to the `master` branch of `mylvzi.github.io`.

### Plugins (from `package.json`)
- `hexo-generator-feed` — Atom feed at `/atom.xml`
- `hexo-generator-sitemap` — Sitemap at `/sitemap.xml`
- `hexo-generator-searchdb` — Local search DB at `/search.xml`
- `hexo-symbols-count-time` / `hexo-word-counter` — Reading time and word counts
- `hexo-algolia` — Algolia search (configured separately)
- `hexo-deployer-git` — Git-based deployment

### Front matter conventions
```yaml
---
title: "文章标题"
date: 2026-05-22 22:00:00
tags:
  - Java
  - 算法
categories:
  - 技术
comment: true
summary: "摘要"
cover: /images/posts/slug/cover.png   # optional
---
```

### Comments
Uses Utterances via `_config.stellar.yml` → `comments.service: utterances` → `comments.utterances.repo: mylvzi/my-blog`.

### Theme customizations
- Dark/light theme with `data-theme` attribute, persisted to `localStorage` (key: `stellar-theme-preference`)
- Busuanzi visitor counter
- APlayer music player (sources from `source/music/`)
- Blog runtime counter since `2026-03-30`
- Font Awesome 6.4.2 via CDN

## Key paths

| Path | Purpose |
|------|---------|
| `source/_posts/` | Blog posts |
| `source/images/posts/<slug>/` | Post images |
| `source/_data/widgets.yml` | Sidebar widget configuration |
| `_config.yml` | Hexo configuration |
| `_config.stellar.yml` | Theme configuration |
| `_config.stellar.yml` → `site_tree` | Navigation structure and sidebar layout |
| `scripts/` | Custom Hexo generation scripts |
| `tools/` | PowerShell post management utilities |
| `.trash/` | Soft-deleted posts (safe recovery) |
| `_legacy_hugo_snapshot/` | Archived Hugo version (not active) |
