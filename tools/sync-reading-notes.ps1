<#
.SYNOPSIS
  Sync reading notes from local directory to Hexo blog.
  Scan E:\lsq_learn\阅读思考合集\ for new .md files and import them as reading notes.

.DESCRIPTION
  - Scans E:\lsq_learn\阅读思考合集\<month-dir>\*.md
  - Parses date from filename (2026-5-28.md -> 2026-05-28)
  - Creates Hexo post with reading_note front matter
  - Tracks imported files in .reading-notes-tracker.json to avoid duplicates
  - Optionally runs deploy.bat to push to remote

.EXAMPLE
  pwsh -ExecutionPolicy Bypass -File .\tools\sync-reading-notes.ps1
  pwsh -ExecutionPolicy Bypass -File .\tools\sync-reading-notes.ps1 -NoDeploy

.SCHEDULE (every 3 days via Windows Task Scheduler)
  schtasks /create /tn "SyncReadingNotes" /tr "pwsh -ExecutionPolicy Bypass -File D:\myblog\my-blog\tools\sync-reading-notes.ps1" /sc daily /mo 3 /st 09:00
#>

param(
  [switch]$NoDeploy
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

$repoRoot = Join-Path $PSScriptRoot ".." | Resolve-Path
$postsDir = Join-Path $repoRoot "source\_posts"
$readingSourceDir = "E:\lsq_learn\阅读思考合集"
$trackerFile = Join-Path $repoRoot ".reading-notes-tracker.json"
$deployScript = Join-Path $repoRoot "deploy.bat"

# Load tracker
$tracker = @{}
if (Test-Path $trackerFile) {
  try {
    $json = Get-Content $trackerFile -Raw -Encoding UTF8
    $tracker = $json | ConvertFrom-Json -AsHashtable
  } catch {
    Write-Host "Tracker file corrupted, starting fresh."
    $tracker = @{}
  }
}

if (-not (Test-Path $readingSourceDir)) {
  Write-Host "Reading source directory not found: $readingSourceDir"
  exit 1
}

function Parse-DateFromFilename([string]$Filename) {
  # 2026-5-28.md -> 2026-05-28
  $name = [IO.Path]::GetFileNameWithoutExtension($Filename)
  $parts = $name -split '-'
  if ($parts.Count -ge 3) {
    $y = $parts[0]
    $m = $parts[1].PadLeft(2, '0')
    $d = $parts[2].PadLeft(2, '0')
    $formatted = "$y-$m-$d"
    # Validate
    try {
      $null = [DateTime]::ParseExact($formatted, "yyyy-MM-dd", $null)
      return @{
        DateFormatted = $formatted
        Display       = $name
      }
    } catch { }
  }
  return $null
}

function New-ReadingFrontMatter([string]$DisplayDate, [string]$FormattedDate) {
  $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  return @"
---
title: "$DisplayDate"
date: $FormattedDate
permalink: reading/$FormattedDate/
reading_note: true
tags:
  - 阅读笔记
comment: true
---

"@
}

$importedCount = 0
$skippedCount = 0
$errors = @()

# Scan month directories
$monthDirs = Get-ChildItem -LiteralPath $readingSourceDir -Directory -ErrorAction SilentlyContinue
foreach ($monthDir in $monthDirs) {
  $mdFiles = Get-ChildItem -LiteralPath $monthDir.FullName -Filter "*.md" -ErrorAction SilentlyContinue
  foreach ($file in $mdFiles) {
    $sourcePath = $file.FullName
    $relativeKey = $sourcePath.Replace($readingSourceDir, "").TrimStart("\").Replace("\", "/")

    # Skip if already imported and unchanged
    if ($tracker.ContainsKey($relativeKey)) {
      $tracked = $tracker[$relativeKey]
      $currentHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
      if ($currentHash -eq $tracked) {
        Write-Host "SKIP (unchanged): $relativeKey"
        $skippedCount++
        continue
      }
    }

    # Parse date
    $dateInfo = Parse-DateFromFilename $file.Name
    if (-not $dateInfo) {
      $msg = "SKIP (bad filename): $relativeKey - cannot parse date"
      Write-Host $msg
      $errors += $msg
      continue
    }

    # Read source content (body only, no front matter)
    $rawContent = Get-Content -LiteralPath $sourcePath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $rawContent -or $rawContent.Trim().Length -eq 0) {
      Write-Host "SKIP (empty): $relativeKey"
      $skippedCount++
      continue
    }

    # Remove existing front matter if any
    $bodyContent = $rawContent
    if ($bodyContent -match "^\s*---[\s\S]*?---") {
      $bodyContent = $bodyContent -replace "^\s*---[\s\S]*?---", ""
    }
    $bodyContent = $bodyContent.Trim()

    if ($bodyContent.Length -eq 0) {
      Write-Host "SKIP (empty after FM removal): $relativeKey"
      $skippedCount++
      continue
    }

    # Generate post filename
    $postFileName = "$($dateInfo.DateFormatted)-reading-note.md"
    $postPath = Join-Path $postsDir $postFileName

    # Check if a post with this permalink already exists (from a different source file)
    if (Test-Path $postPath) {
      Write-Host "SKIP (post exists): $postFileName"
      $skippedCount++
      # Still update tracker
      $tracker[$relativeKey] = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
      continue
    }

    # Build the post
    $frontMatter = New-ReadingFrontMatter -DisplayDate $dateInfo.Display -FormattedDate $dateInfo.DateFormatted
    $postContent = $frontMatter + $bodyContent + "`n"

    try {
      Set-Content -LiteralPath $postPath -Value $postContent -Encoding UTF8 -NoNewline
      Write-Host "IMPORTED: $relativeKey -> $postFileName"

      # Update tracker
      $tracker[$relativeKey] = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash
      $importedCount++
    } catch {
      $msg = "ERROR: $relativeKey - $_"
      Write-Host $msg
      $errors += $msg
    }
  }
}

# Save tracker
try {
  $trackerJson = $tracker | ConvertTo-Json
  Set-Content -LiteralPath $trackerFile -Value $trackerJson -Encoding UTF8 -NoNewline
} catch {
  Write-Host "Warning: Failed to save tracker file: $_"
}

Write-Host ""
Write-Host "===== Sync Summary ====="
Write-Host "Imported: $importedCount"
Write-Host "Skipped : $skippedCount"
if ($errors.Count -gt 0) {
  Write-Host "Errors  : $($errors.Count)"
  $errors | ForEach-Object { Write-Host "  $_" }
}

if ($importedCount -eq 0) {
  Write-Host "No new notes to import. Done."
  exit 0
}

# Build
Write-Host ""
Write-Host "===== Building Hexo ====="
Push-Location $repoRoot
try {
  $buildOutput = & npm run build 2>&1
  $buildExitCode = $LASTEXITCODE
  $buildOutput | ForEach-Object { Write-Host $_ }
  if ($buildExitCode -ne 0) {
    Write-Host "Build failed, skipping deploy."
    Pop-Location
    exit 1
  }
} finally {
  Pop-Location
}

# Deploy
if (-not $NoDeploy) {
  Write-Host ""
  Write-Host "===== Deploying ====="
  Push-Location $repoRoot
  try {
    cmd /c "echo. | call `"$deployScript`""
    if ($LASTEXITCODE -ne 0) {
      Write-Host "Deploy failed with exit code $LASTEXITCODE"
      Pop-Location
      exit 1
    }
  } finally {
    Pop-Location
  }
  Write-Host "Deploy complete. GitHub Actions will publish to mylvzi.github.io."
} else {
  Write-Host "Deploy skipped (-NoDeploy). Run .\deploy.bat manually to push."
}
