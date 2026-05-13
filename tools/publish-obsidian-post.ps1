<#
.SYNOPSIS
  Publish an Obsidian Markdown note to the Hexo blog.

.EXAMPLE
  pwsh -ExecutionPolicy Bypass -File .\tools\publish-obsidian-post.ps1 "C:\path\to\note.md" -Tags "Python,开源项目" -Category "教程分享"

.EXAMPLE
  pwsh -ExecutionPolicy Bypass -File .\tools\publish-obsidian-post.ps1 "C:\path\to\note.md" -NoDeploy -RestartServer
#>

param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$InputPath,

  [string]$AssetsDir = "C:\Users\绿字\Desktop\lsq_learn\img",

  [string]$Slug = "",

  [string[]]$Tags = @("教程分享"),

  [string]$Category = "教程分享",

  [string]$Date = "",

  [string]$PythonExe = "py",

  [switch]$NoDeploy,

  [switch]$RestartServer
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$OutputEncoding = [Text.Encoding]::UTF8
$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

function Resolve-RequiredPath([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "$Label 不存在: $Path"
  }
  return (Resolve-Path -LiteralPath $Path).Path
}

function ConvertTo-Slug([string]$Text) {
  $ascii = [Text.Encoding]::ASCII.GetString([Text.Encoding]::GetEncoding("Cyrillic").GetBytes($Text)).ToLowerInvariant()
  $slug = [regex]::Replace($ascii, "[^a-z0-9]+", "-").Trim("-")
  if ($slug) {
    return $slug
  }
  $sha1 = [Security.Cryptography.SHA1]::Create()
  $bytes = [Text.Encoding]::UTF8.GetBytes($Text)
  $hash = -join ($sha1.ComputeHash($bytes) | ForEach-Object { $_.ToString("x2") })
  return "post-$($hash.Substring(0, 8))"
}

function Remove-FrontMatter([string]$Text) {
  return [regex]::Replace($Text, "(?s)^---\r?\n.*?\r?\n---\r?\n?", "", 1)
}

function Get-FrontMatterValue([string]$Text, [string]$Key) {
  $match = [regex]::Match($Text, "(?m)^$([regex]::Escape($Key)):\s*(.+?)\s*$")
  if ($match.Success) {
    return $match.Groups[1].Value.Trim(" `"'")
  }
  return ""
}

function Get-Summary([string]$Text) {
  $body = Remove-FrontMatter $Text
  $body = [regex]::Replace($body, '(?s)```.*?```', ' ')
  $body = [regex]::Replace($body, '!\[\[[^\]]+\]\]', ' ')
  $body = [regex]::Replace($body, '!\[[^\]]*\]\([^)]+\)', ' ')
  $body = [regex]::Replace($body, '\[([^\]]+)\]\([^)]+\)', '$1')
  $body = [regex]::Replace($body, '<[^>]+>', ' ')
  $body = [regex]::Replace($body, '[>#*_`-]+', ' ')
  $body = [regex]::Replace($body, '\s+', ' ').Trim()
  if ($body.Length -le 100) {
    return $body
  }
  return $body.Substring(0, 100).Trim() + "..."
}

function Format-YamlList([string[]]$Items) {
  if (-not $Items -or $Items.Count -eq 0) {
    return '  - "notes"'
  }
  return (($Items | Where-Object { $_ } | ForEach-Object { '  - "' + (ConvertTo-YamlDoubleQuoted $_) + '"' }) -join "`n")
}

function ConvertTo-YamlDoubleQuoted([string]$Value) {
  if ($null -eq $Value) {
    return ""
  }
  return $Value.Replace("\", "\\").Replace('"', '\"').Replace("`r", " ").Replace("`n", " ")
}

function Normalize-Tags([string[]]$Items) {
  $result = @()
  foreach ($item in $Items) {
    $result += $item -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ }
  }
  if ($result.Count -eq 0) {
    return @("教程分享")
  }
  return $result
}

function Set-FrontMatter([string]$Text, [string]$Title, [string]$PostDate, [string[]]$PostTags, [string]$PostCategory, [string]$Summary) {
  $body = Remove-FrontMatter $Text
  $tagYaml = Format-YamlList $PostTags
$frontMatter = @"
---
title: "$(ConvertTo-YamlDoubleQuoted $Title)"
date: $PostDate
tags:
$tagYaml
categories:
  - "$(ConvertTo-YamlDoubleQuoted $PostCategory)"
comment: true
summary: "$(ConvertTo-YamlDoubleQuoted $Summary)"
---

"@
  return $frontMatter + $body.TrimStart()
}

function Assert-NoBrokenImageRefs([string]$PostPath) {
  $content = Get-Content -LiteralPath $PostPath -Raw -Encoding UTF8
  $broken = @()
  if ($content -match "!\[\[") { $broken += "Obsidian 图片语法 ![[...]]" }
  $localImageMatches = [regex]::Matches($content, '!\[[^\]]*\]\(([^)]+)\)')
  foreach ($match in $localImageMatches) {
    $imagePath = $match.Groups[1].Value.Trim()
    if ($imagePath -match '^[A-Za-z]:\\|C:\\Users|Desktop\\') {
      $broken += "图片本机路径: $imagePath"
    }
  }
  if ($broken.Count -gt 0) {
    throw "文章仍包含未处理引用: $($broken -join ', ')"
  }
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$postsDir = Join-Path $repoRoot "source\_posts"
$importScript = "C:\Users\绿字\.codex\skills\csdn-hexo-import\scripts\import_csdn_md.py"
$deployScript = Join-Path $repoRoot "deploy.bat"

$sourcePath = Resolve-RequiredPath $InputPath "Obsidian Markdown 文件"
if ($AssetsDir) {
  $AssetsDir = Resolve-RequiredPath $AssetsDir "Obsidian 附件目录"
}
Resolve-RequiredPath $postsDir "Hexo 文章目录" | Out-Null
Resolve-RequiredPath $importScript "图片导入脚本" | Out-Null
Resolve-RequiredPath $deployScript "部署脚本" | Out-Null

if (-not $Date) {
  $Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}
$Tags = Normalize-Tags $Tags

$sourceText = Get-Content -LiteralPath $sourcePath -Raw -Encoding UTF8
$fileTitle = [IO.Path]::GetFileNameWithoutExtension($sourcePath)
$existingTitle = Get-FrontMatterValue $sourceText "title"
$title = if ($existingTitle) { $existingTitle } else { $fileTitle }
$summary = Get-FrontMatterValue $sourceText "summary"
if (-not $summary) {
  $summary = Get-Summary $sourceText
}
if (-not $Slug) {
  $Slug = ConvertTo-Slug $title
}

$postPath = Join-Path $postsDir ([IO.Path]::GetFileName($sourcePath))
Copy-Item -LiteralPath $sourcePath -Destination $postPath -Force

$postText = Get-Content -LiteralPath $postPath -Raw -Encoding UTF8
$postText = Set-FrontMatter -Text $postText -Title $title -PostDate $Date -PostTags $Tags -PostCategory $Category -Summary $summary
Set-Content -LiteralPath $postPath -Value $postText -Encoding UTF8 -NoNewline

$importArgs = @($importScript, "--input", $postPath, "--repo-root", $repoRoot, "--slug", $Slug)
if ($AssetsDir) {
  $importArgs += @("--assets-dir", $AssetsDir)
}
& $PythonExe @importArgs
if ($LASTEXITCODE -ne 0) {
  throw "图片导入失败: $PythonExe 退出码 $LASTEXITCODE"
}

# Re-apply front matter after image rewriting so title/category metadata stays intentional.
$postText = Get-Content -LiteralPath $postPath -Raw -Encoding UTF8
$postText = Set-FrontMatter -Text $postText -Title $title -PostDate $Date -PostTags $Tags -PostCategory $Category -Summary $summary
Set-Content -LiteralPath $postPath -Value $postText -Encoding UTF8 -NoNewline

Assert-NoBrokenImageRefs $postPath

Push-Location $repoRoot
try {
  $buildOutput = & npm run build 2>&1
  $buildExitCode = $LASTEXITCODE
  $buildOutput | ForEach-Object { Write-Host $_ }
  $buildText = $buildOutput -join "`n"
  if ($buildExitCode -ne 0 -or $buildText -match "ERROR|YAMLException|Process failed|Script load failed") {
    throw "Hexo 构建失败"
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
      throw "deploy.bat 执行失败"
    }
  }
} finally {
  Pop-Location
}

$previewPath = (Join-Path "source\_posts" ([IO.Path]::GetFileName($postPath)))
$imageDir = Join-Path $repoRoot "source\images\posts\$Slug"
Write-Host "完成: $title"
Write-Host "文章: $previewPath"
Write-Host "图片: $imageDir"
Write-Host "Slug: $Slug"
if ($NoDeploy) {
  Write-Host "部署: 已跳过 (-NoDeploy)"
} else {
  Write-Host "部署: 已执行 deploy.bat"
}
