---
title: "Hello World"
date: 2026-03-25T12:00:00+08:00
draft: false
tags: ["hello", "hugo"]
categories: ["general"]
---

这是我的第一篇博客文章，使用 Hugo 静态网站生成器。

Hugo 是一个用 Go 语言编写的快速、现代的静态网站生成器。

## 特性

- 极快的生成速度
- 丰富的主题
- 简单的 Markdown 写作
- 灵活的模板系统

## 开始使用

安装 Hugo：

```bash
# macOS
brew install hugo

# Windows
choco install hugo
```

创建新站点：

```bash
hugo new site myblog
```

添加主题：

```bash
cd myblog
git init
git submodule add https://github.com/theNewDynamic/gohugo-theme-ananke themes/ananke
```

创建文章：

```bash
hugo new posts/hello-world.md
```

启动本地服务器：

```bash
hugo server -D
```