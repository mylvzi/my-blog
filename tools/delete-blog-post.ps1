<#
.SYNOPSIS
  Delete a Hexo blog post by title, filename, or URL keyword.

.EXAMPLE
  pwsh -ExecutionPolicy Bypass -File .\tools\delete-blog-post.ps1 "利用ClaudeCode"

.EXAMPLE
  pwsh -ExecutionPolicy Bypass -File .\tools\delete-blog-post.ps1 "Oh My Posh" -NoDeploy

.NOTES
  The script moves deleted files into .trash/deleted-posts/<timestamp>/ before building.
#>

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Query,

  [switch]$NoDeploy,

  [switch]$Force,

  [switch]$RestartServer
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8

function Resolve-InRepoPath([string]$Path, [string]$RepoRoot) {
  $resolved = (Resolve-Path -LiteralPath $Path).Path
  $repo = (Resolve-Path -LiteralPath $RepoRoot).Path
  if (-not $resolved.StartsWith($repo, [StringComparison]::OrdinalIgnoreCase)) {
    throw "路径不在博客仓库内，拒绝操作: $resolved"
  }
  return $resolved
}

function Get-FrontMatterValue([string]$Text, [string]$Key) {
  $match = [regex]::Match($Text, "(?m)^$([regex]::Escape($Key)):\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim(" `"'")
  }
  return ""
}

function Normalize-Text([string]$Value) {
  return ($Value -replace '\\', '/' -replace '\s+', ' ').ToLowerInvariant()
}

function Find-PostMatches([string]$PostsDir, [string]$QueryText) {
  $needle = Normalize-Text $QueryText
  $posts = Get-ChildItem -LiteralPath $PostsDir -File -Filter "*.md"
  $matches = @()
  foreach ($post in $posts) {
    $text = Get-Content -LiteralPath $post.FullName -Raw -Encoding UTF8
    $title = Get-FrontMatterValue $text "title"
    if (-not $title) {
      $title = [IO.Path]::GetFileNameWithoutExtension($post.Name)
    }
    $haystack = Normalize-Text "$($post.Name) $title $($post.FullName)"
    if ($haystack.Contains($needle)) {
      $matches += [pscustomobject]@{
        Path = $post.FullName
        Name = $post.Name
        Title = $title
        Content = $text
      }
    }
  }
  return $matches
}

function Get-ImageDirsFromPost([string]$Content, [string]$RepoRoot) {
  $dirs = New-Object System.Collections.Generic.HashSet[string]
  $matches = [regex]::Matches($Content, '!\[[^\]]*\]\(/images/posts/([^/]+)/[^)]+\)')
  foreach ($match in $matches) {
    $slug = $match.Groups[1].Value
    $dir = Join-Path $RepoRoot "source\images\posts\$slug"
    if (Test-Path -LiteralPath $dir) {
      [void]$dirs.Add((Resolve-Path -LiteralPath $dir).Path)
    }
  }
  return @($dirs)
}

function Move-ToTrash([string]$Path, [string]$TrashRoot, [string]$RepoRoot) {
  $safePath = Resolve-InRepoPath $Path $RepoRoot
  $relative = [IO.Path]::GetRelativePath($RepoRoot, $safePath)
  $target = Join-Path $TrashRoot $relative
  $targetParent = Split-Path -Parent $target
  New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
  Move-Item -LiteralPath $safePath -Destination $target -Force
  return $target
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$postsDir = Join-Path $repoRoot "source\_posts"
$deployScript = Join-Path $repoRoot "deploy.bat"

Resolve-InRepoPath $postsDir $repoRoot | Out-Null
Resolve-InRepoPath $deployScript $repoRoot | Out-Null

$matches = Find-PostMatches $postsDir $Query
if ($matches.Count -eq 0) {
  throw "没有找到匹配文章: $Query"
}
if ($matches.Count -gt 1) {
  Write-Host "找到多篇匹配文章，请用更精确的关键字重新执行："
  for ($i = 0; $i -lt $matches.Count; $i++) {
    Write-Host "[$($i + 1)] $($matches[$i].Title)  ->  $($matches[$i].Name)"
  }
  throw "匹配结果不唯一，已停止。"
}

$post = $matches[0]
$imageDirs = Get-ImageDirsFromPost $post.Content $repoRoot

Write-Host "将删除文章: $($post.Title)"
Write-Host "文章文件: $($post.Path)"
if ($imageDirs.Count -gt 0) {
  Write-Host "关联图片目录:"
  $imageDirs | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host "关联图片目录: 无"
}

if (-not $Force) {
  $answer = Read-Host "确认删除并构建吗？输入 DELETE 继续"
  if ($answer -ne "DELETE") {
    Write-Host "已取消。"
    exit 0
  }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$trashRoot = Join-Path $repoRoot ".trash\deleted-posts\$timestamp"
New-Item -ItemType Directory -Path $trashRoot -Force | Out-Null

$moved = @()
$moved += Move-ToTrash $post.Path $trashRoot $repoRoot
foreach ($dir in $imageDirs) {
  if (Test-Path -LiteralPath $dir) {
    $moved += Move-ToTrash $dir $trashRoot $repoRoot
  }
}

Push-Location $repoRoot
try {
  $buildOutput = & npm run build 2>&1
  $buildExitCode = $LASTEXITCODE
  $buildOutput | ForEach-Object { Write-Host $_ }
  $buildText = $buildOutput -join "`n"
  if ($buildExitCode -ne 0 -or $buildText -match "ERROR|YAMLException|Process failed|Script load failed") {
    throw "Hexo 构建失败，已删除内容在: $trashRoot"
  }

  if ($RestartServer) {
    $conn = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($conn) {
      Stop-Process -Id $conn.OwningProcess -Force
      Start-Sleep -Seconds 2
    }
    $out = Join-Path $repoRoot ".hexo-server.out.log"
    $err = Join-Path $repoRoot ".hexo-server.err.log"
    Remove-Item -LiteralPath $out, $err -Force -ErrorAction SilentlyContinue
    Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "start") -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err
  }

  if (-not $NoDeploy) {
    cmd /c "echo. | call `"$deployScript`""
    if ($LASTEXITCODE -ne 0) {
      throw "deploy.bat 执行失败，已删除内容在: $trashRoot"
    }
  }
} finally {
  Pop-Location
}

Write-Host "删除完成: $($post.Title)"
Write-Host "备份位置: $trashRoot"
if ($NoDeploy) {
  Write-Host "部署: 已跳过 (-NoDeploy)"
} else {
  Write-Host "部署: 已执行 deploy.bat"
}
