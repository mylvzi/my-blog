# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Lvzi's Blog** (`Lvzi' s Blog`) — a personal tech & life blog built with **Hexo 6.3.0** and the **Stellar** theme (`hexo-theme-stellar` ^1.29.1). Author: sq Liu (GitHub `mylvzi`). Content is mostly Chinese and mixes algorithm/engineering notes (LeetCode, Java, system design), AI/tooling write-ups, daily reading notes, and short personal musings.

**Two-repo deploy model.** Source lives on the `main` branch of this repo (`mylvzi/my-blog`). Pushing to `main` triggers GitHub Actions, which runs `hexo clean && hexo d` and pushes the *generated* static site to the `master` branch of the `mylvzi.github.io` repo. Live site: https://mylvzi.github.io — you normally never build the public site by hand; you push source and let Actions deploy.

This repo is maintained from **both macOS** (`.sh` tools) **and Windows** (`.ps1` tools). Config is split across `_config.yml` (Hexo core) and `_config.stellar.yml` (theme). Node 20 (`.nvmrc` → `20.8.1`).

## Common commands

```bash
npm install            # install deps (first run / after package.json changes)
npm run build          # hexo clean & hexo generate — run before every deploy to verify it builds
npm run start          # hexo clean & hexo server -l -p 4000 — local preview at http://localhost:4000
npm run deploy         # bash tools/hexo_deploy.sh — run hexo's git deployer directly (alternate path)

# One-shot "build + commit + push to main" (GitHub Actions then deploys the site):
bash deploy.sh "commit message"     # macOS/Linux — pushes over SSH on port 443; accepts --skip-build
deploy.bat "commit message"         # Windows — retries push via local proxy 127.0.0.1:7897 on failure
```

The npm `build`/`start` scripts use a single `&` (written for Windows `cmd`, where `&` is sequential). On macOS/Linux `&` backgrounds `hexo clean`, so if you ever hit a stale-cache/race issue, run `hexo clean` explicitly before `hexo generate`/`hexo server`.

## Content model

All content is Markdown under `source/`. There are **four content types**, distinguished by front-matter flags and filename patterns:

1. **Regular posts** — `source/_posts/YYYY-MM-DD-slug.md`. Appear on the homepage, archives, categories, and tags.
2. **Reading notes** (`阅读笔记`) — `source/_posts/YYYY-MM-DD-reading-note.md`, front matter `reading_note: true`, `permalink: reading/<date>/`. **Hidden from the homepage** (marked `indexing: false` by `scripts/reading-notes.js`) and instead aggregated by month into a `/reading/` index plus `/reading/YYYY-MM/` pages.
3. **Practice logs** (`事上磨练日志`) — `source/_posts/YYYY-MM-DD-practice-log.md`, front matter `practice_log: true`, `permalink: practice/<date>/`. Excluded from the "recent" sidebar widget and the archive timeline.
4. **Musings** (`碎碎念`) — **not posts.** Stored as a JSON array in `source/_data/musings.json` (`{date, content}`, newest first) and rendered to the `/musing/` timeline page by `scripts/musings.js`.

### Front matter (regular post)
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
cover: /images/posts/<slug>/cover.png   # optional
---
```

Images: place per-post images in `source/images/posts/<slug>/` and reference them with an **absolute site path** like `/images/posts/<slug>/img_01.png` — never a local machine path (`C:\...`, `/Users/...`), which won't resolve online.

## Creating & managing content

Prefer the helpers in `tools/`. Each one does: import/modify → `npm run build` → `deploy.sh` (unless `--no-deploy`). Both macOS (`.sh`) and Windows (`.ps1`) variants exist:

| Task | macOS | Windows |
|------|-------|---------|
| Publish a Markdown/Obsidian note as a post | `bash tools/publish-post.sh <file.md> [-c 分类] [-t 标签,逗号] [-s slug] [--no-deploy] [--restart-server]` | `pwsh -File tools/publish-obsidian-post.ps1 <file.md> -Category .. -Tags .. -Slug .. [-NoDeploy]` |
| Delete a post by keyword | `bash tools/delete-post.sh "关键词" [--no-deploy] [--force]` | `pwsh -File tools/delete-blog-post.ps1 "关键词" [-NoDeploy] [-Force]` |
| Add a 碎碎念 entry | `bash tools/add-musing.sh "内容" [--no-deploy]` | — |
| Sync reading notes from external source | `bash tools/sync-reading-notes.sh` | `tools/sync-reading-notes.ps1` |
| Sync practice logs from external source | `bash tools/sync-practice-log.sh` | `tools/sync-practice-log.ps1` |

- **publish-post.sh** copies the file into `source/_posts/`, rewrites front matter (auto title/summary/slug via Python), warns on Obsidian `![[...]]` image syntax, builds, and deploys.
- **delete-post.sh** matches by filename/title keyword, **aborts if more than one match**, backs up the post + its referenced image dirs to `.trash/deleted-posts/<timestamp>/` (soft delete), then rebuilds & deploys. Requires typing `DELETE` to confirm unless `--force`.
- **sync-*** scripts import `.md` files from an external source dir (default is a USB volume `/Volumes/KINGSTON/lsq_learn/…`; override with `READING_SOURCE_DIR` / `PRACTICE_SOURCE_DIR`). They store SHA-256 content hashes in `.reading-notes-tracker.json` / `.practice-log-tracker.json` so only new/changed files are (re)imported.

Manual Hexo CLI also works: `hexo new post "Title"`, `hexo new draft "Title"`, `hexo publish post "Title"` (templates in `scaffolds/`).

## Custom Hexo scripts (`scripts/`)

These run automatically during `hexo generate`:

- **`reading-notes.js`** — generator for `/reading/` (month index) and `/reading/YYYY-MM/` pages from `reading_note: true` posts; plus a `before_post_render` filter that sets `indexing: false` on those posts so Stellar's homepage skips them.
- **`musings.js`** — generator that builds the `/musing/` year→month timeline page from `source/_data/musings.json`.
- **`archive-timeline.js`** — `after_render:html` filter that replaces Stellar's default archive list with a custom year→month timeline (excludes reading-note & practice-log posts).
- **`fix-recent-widget-order.js`** — `after_render:html` filter that rewrites the sidebar "recent posts" widget with correctly date-sorted links (excludes reading-note & practice-log posts). Count comes from theme config `widgets.recent.limit` (default 4).
- **`hide-categories-tags-nav.js`** — `after_render:html` filter that strips the `标签`/tags link from the top nav bar.

## Theme & front-end (`_config.stellar.yml`)

- **Nav tabs** (blog index): `关于我 → /about/`, `阅读笔记 → /reading/`, `碎碎念 → /musing/`. **Sidebar**: `starter, welcome, recent`.
- **Welcome widget** copy lives in `source/_data/widgets.yml` (profile card: *"内驭专注，外抱好奇 / 事上磨练，终身进化"*).
- **Comments**: Utterances → GitHub issues on repo `mylvzi/my-blog`.
- **Injected assets**: `source/css/theme-toggle.css`, `source/css/archive-timeline.css`, `source/js/music-player.js` (APlayer), `source/js/intro-animation.js` (homepage intro, see below); Font Awesome 6.4.2 & APlayer via CDN. An inline `<script>` forces `data-theme=light` on load.
- **Fonts**: Source Han Sans / Noto Sans CJK (body & logo), JetBrains Mono (code).

**Design direction — important.** The blog was deliberately redesigned (2026-06) from a "flashy" multi-color look to a **warm minimalist** style (暖白 `#faf8f5` / 深棕 `#3d3629`), documented in `docs/spark/2026-06-12-minimalist-redesign-design.md`. That redesign **removed** `blog-effects.js`, `blog-runtime.js`, and the `polish-homepage.js` / `footer-stats.js` / `heatmap-helper.js` scripts. Do **not** reintroduce cursor-tracking effects, reading-progress bars, footer stats, or colored card decorations. `source/js/` contains `music-player.js` and `intro-animation.js`.

**Homepage intro splash (intentional exception).** `source/js/intro-animation.js` (filename kept from an earlier animated draft — it is now a **static poster**, not an animation) is a self-contained homepage cover added by explicit user request: an **original** poster-style tribute to Kawhi Leonard's 2019 Toronto Raptors run — a stylized silhouette in a red #2 jersey on a black/red torn-paper background, with the blog name + welcome overlaid. It injects its own `<style>` + an inline-**SVG** overlay, runs **homepage-only**, **once per browser session** (`sessionStorage` key `lvziSplashSeen`), auto-dismisses after ~4s, is **skippable** (button / Esc / click), and respects `prefers-reduced-motion`. Loaded via one line in `_config.stellar.yml` → `inject.head`. Test hook: `?introtest=1` or `window.__RAP_INTRO_FORCE__=true` bypasses the guards. **Do not remove it as "leftover" redesign cruft.** It is deliberately **original vector art** — no real photos, no player likeness, no team/league/brand logos (Raptors, NBA, Nike…), no trademarked slogans, no third-party watermark; keep it that way (the user referenced a copyrighted fan poster, which must **not** be reproduced). To use a real photo, the file exposes `BG_IMAGE` (default `/images/intro-bg.jpg`) and `SHOW_TEXT` at the top: a user-owned image dropped at `source/images/intro-bg.jpg` is shown full-bleed (cover) over the illustration, which is the fallback when the file is absent.

## Plugins (`package.json`)

`hexo-generator-feed` (Atom `/atom.xml`), `hexo-generator-sitemap` (`/sitemap.xml`), `hexo-generator-searchdb` (local search `/search.xml`), `hexo-generator-{index,archive,category,tag}`, `hexo-symbols-count-time` + `hexo-word-counter` (reading time / word counts), `hexo-renderer-{ejs,marked,stylus}`, `hexo-deployer-git`, `hexo-algolia`, `hexo-server`.

## Deployment internals

- `.github/workflows/deploy.yml` (job `CI`): on push to `main`, Node 20, decodes an SSH key from secret `HEXO_DEPLOY_PRI_B64`, `npm install`, then `hexo clean && hexo d`.
- `hexo d` reads `_config.yml → deploy:` (type `git`, `git@github.com:mylvzi/mylvzi.github.io.git`, branch `master`) — that's what publishes the built site to the `mylvzi.github.io` repo.

## Key paths

| Path | Purpose |
|------|---------|
| `source/_posts/` | All posts (regular, reading-note, practice-log) |
| `source/images/posts/<slug>/` | Per-post images |
| `source/_data/musings.json` | 碎碎念 entries (rendered to `/musing/`) |
| `source/_data/widgets.yml` | Sidebar welcome-widget copy |
| `source/{about,projects}/` | Static pages |
| `_config.yml` / `_config.stellar.yml` | Hexo core / Stellar theme config |
| `scripts/` | Custom Hexo generators & filters (run on `hexo generate`) |
| `tools/` | Post-management helpers (`.sh` macOS, `.ps1` Windows) |
| `.reading-notes-tracker.json` / `.practice-log-tracker.json` | Sync content-hash trackers |
| `.trash/deleted-posts/<timestamp>/` | Soft-deleted posts (recoverable) |
| `public/` | Generated site output (build artifact) |
| `db.json` | Hexo cache database (generated) |
| `docs/spark/` | Design docs (e.g. the minimalist redesign) |
| `.agents/skills/spark/` | Vendored "spark" spec/design skill (from `wishworldbetter/seedex-skills`; pinned in `skills-lock.json`) |
| `_legacy_hugo_snapshot/` | Archived old Hugo version — inactive, ignore |
| `博客操作流程.md` | Full Chinese ops runbook (publish / edit / delete / preview / troubleshoot) |

## Gotchas

- **Always `npm run build` before deploying.** The most common failure is front-matter YAML: keep a space after `:`, and quote titles containing `:` or special characters.
- Reading-note and practice-log posts are **intentionally** absent from the homepage / recent / archive — by design (see scripts above), not a bug.
- `future: true` is set in `_config.yml`, so future-dated posts still render.
- `.trash/` is soft-delete only; recover a post by moving its `.md` back to `source/_posts/` and its images back to `source/images/posts/`, then rebuild & deploy.
