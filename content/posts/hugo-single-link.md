---
title: "Hugo 单链接配置"
date: 2026-03-24T10:30:00+08:00
draft: false
tags: ["hugo", "configuration"]
categories: ["tutorial"]
---

在 Hugo 中，单链接（Single）是指单独的文章页面。默认情况下，Hugo 会根据内容文件的位置自动生成 URL。

## URL 管理

Hugo 提供了灵活的 URL 管理功能。在 `config.toml` 中可以通过 `permalinks` 设置自定义永久链接格式：

```toml
[permalinks]
  posts = "/:year/:month/:title/"
```

## 自定义布局

要为特定文章使用不同的布局，可以在文章前置元数据中指定 `layout`：

```yaml
---
title: "自定义布局文章"
layout: "special"
---
```

然后在 `layouts/_default/` 或 `layouts/posts/` 目录中创建 `special.html` 模板。

## 相关文章

Hugo 可以自动查找相关文章。在单篇文章模板中使用：

```go
{{ $related := .Site.RegularPages.Related . | first 5 }}
{{ with $related }}
<h3>相关文章</h3>
<ul>
{{ range . }}
  <li><a href="{{ .RelPermalink }}">{{ .Title }}</a></li>
{{ end }}
</ul>
{{ end }}
```