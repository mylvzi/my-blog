---
title: "从零开始搭建Hugo博客：PaperMod主题与GitHub Pages部署"
date: 2026-03-28 10:00:00
tags:
  - hugo
  - 教程
  - github-pages
  - 博客
  - papermod
categories:
  - 技术
comment: true
summary: "记录我搭建个人博客的全过程，从Hugo安装、主题选择到最终部署到GitHub Pages。"
---


最近想要搭建一个个人博客，经过一番调研后选择了 Hugo 静态网站生成器。它速度快、主题丰富，而且完全免费托管在 GitHub Pages 上。下面是我整个搭建过程的记录，希望对想要自己搭建博客的朋友有所帮助。

## 为什么选择 Hugo？

在决定使用 Hugo 之前，我也考虑过其他静态网站生成器，比如 Jekyll、Hexo 等。最终选择 Hugo 主要有以下几个原因：

1. **生成速度极快**：Hugo 用 Go 语言编写，生成上千篇文章也只需要几秒钟。
2. **主题生态丰富**：有大量高质量的主题可供选择，大多数都支持响应式设计。
3. **配置简单**：配置文件清晰易懂，不需要复杂的依赖环境。
4. **免费部署**：可以轻松部署到 GitHub Pages、Netlify、Vercel 等平台。

## 安装 Hugo

Hugo 的安装非常简单，根据你的操作系统选择相应的方式：

```bash
# macOS（使用 Homebrew）
brew install hugo

# Windows（使用 Chocolatey）
choco install hugo

# Linux（使用包管理器）
sudo apt install hugo  # Ubuntu/Debian
```

安装完成后，可以通过 `hugo version` 验证是否安装成功。

## 创建新站点

创建一个新的 Hugo 站点只需要一条命令：

```bash
hugo new site myblog
cd myblog
```

这条命令会创建一个名为 `myblog` 的目录，里面包含了 Hugo 站点的基本结构：

```
myblog/
├── archetypes/     # 内容模板
├── content/        # 文章内容
├── data/           # 数据文件
├── layouts/        # 布局文件
├── static/         # 静态资源
├── themes/         # 主题
└── config.toml     # 配置文件
```

## 选择并安装主题

Hugo 的主题非常多，我最终选择了 **PaperMod** 主题。这个主题功能丰富、设计简洁，而且支持很多实用功能：

- 亮色/暗色主题切换
- 文章阅读时间估计
- 代码高亮
- 搜索功能
- 社交图标
- 多语言支持

安装主题使用 Git 子模块的方式：

```bash
git init
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
```

这种方式的好处是主题可以独立更新，不会影响你的自定义配置。

## 基本配置

Hugo 的配置文件可以是 `config.toml`、`config.yaml` 或 `config.json`，我选择了 TOML 格式。以下是我的基本配置：

```toml
baseURL = "https://mylvzi.github.io/"
languageCode = "zh-cn"
title = "lvzi's blog"
theme = "PaperMod"

defaultContentLanguage = "zh-cn"
defaultContentLanguageInSubdir = false

[params]
  description = "Welcome To My Blog"
  author = "lvzi"
  defaultTheme = "auto"  # 自动根据系统偏好选择亮色/暗色
  homeInfoMode = "PostList"  # 首页显示文章列表

  # 社交链接
  github = "mylvzi"

  # 功能设置
  ShowReadingTime = true
  ShowShareButtons = true
  ShowCodeCopyButtons = true
  search = true

[menu]
  [[menu.main]]
    identifier = "posts"
    name = "文章"
    url = "/posts/"
    weight = 1

  [[menu.main]]
    identifier = "archives"
    name = "归档"
    url = "/archives/"
    weight = 2

  [[menu.main]]
    identifier = "search"
    name = "搜索"
    url = "/search/"
    weight = 3

  [[menu.main]]
    identifier = "about"
    name = "关于"
    url = "/about/"
    weight = 4
```

## 创建页面和文章

### 创建关于页面

```bash
hugo new about.md
```

编辑 `content/about.md`，添加个人介绍和博客信息。

### 创建文章

```bash
hugo new posts/hello-world.md
```

每篇文章的前面都有 Front Matter（前置元数据），用于定义文章的标题、日期、标签等信息：

```yaml
---
title: "文章标题"
date: 2026-03-25T12:00:00+08:00
draft: false
tags: ["标签1", "标签2"]
categories: ["分类"]
summary: "文章摘要"
---
```

## 本地测试

在本地启动 Hugo 开发服务器：

```bash
hugo server -D
```

`-D` 参数表示包含草稿文章。访问 `http://localhost:1313` 就可以在本地预览博客了。Hugo 支持热重载，修改内容后页面会自动刷新。

## 部署到 GitHub Pages

### 创建 GitHub 仓库

1. 在 GitHub 上创建一个新的仓库，名称为 `用户名.github.io`（例如 `mylvzi.github.io`）
2. 将本地仓库推送到 GitHub：

```bash
git remote add origin https://github.com/用户名/用户名.github.io.git
git add .
git commit -m "初始提交"
git push -u origin main
```

### 创建部署脚本

为了方便后续更新，我创建了一个部署脚本 `deploy.sh`：

```bash
#!/bin/bash

echo -e "\033[0;32m部署更新到 GitHub Pages...\033[0m"

# 构建网站（生产环境）
echo "清理旧构建文件..."
if [ -d "public" ]; then
    find public -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
fi

echo "构建生产版本..."
hugo --minify --environment production

# 进入 public 目录
cd public

# 添加更改
git add .

# 提交更改
msg="更新内容 $(date)"
if [ -n "$*" ]; then
    msg="$*"
fi
git commit -m "$msg"

# 推送到远程仓库
git push origin master

# 回到项目根目录
cd ..

echo -e "\033[0;32m部署完成！\033[0m"
```

### 执行部署

给脚本添加执行权限并运行：

```bash
chmod +x deploy.sh
./deploy.sh
```

部署完成后，访问 `https://用户名.github.io` 就可以看到你的博客了。

## 自定义与优化

### 添加自定义样式

如果需要修改主题样式，可以在 `assets/css/extended/` 目录下创建自定义 CSS 文件，然后在配置中添加：

```toml
[params]
  customCSS = ["css/extended/custom.css"]
```

### 启用评论系统

PaperMod 主题支持多种评论系统，如 Disqus、Utterances 等。以 Utterances（基于 GitHub Issues）为例：

```toml
[params]
  comments = true

[params.utterances]
  repo = "用户名/用户名.github.io"
  issueTerm = "pathname"
  theme = "github-light"
```

### 添加分析工具

如果需要统计访问数据，可以添加 Google Analytics：

```toml
[services.googleAnalytics]
  id = "G-XXXXXXXXXX"
```

## 遇到的问题与解决方案

### 中文编码问题

在 Windows 环境下，有时会遇到中文乱码问题。解决方案是在配置中明确指定编码：

```toml
languageCode = "zh-cn"
defaultContentLanguage = "zh-cn"
```

### 图片路径问题

在文章中引用图片时，建议将图片放在 `static/images/` 目录下，然后使用相对路径引用：

```markdown
![图片描述](/images/example.jpg)
```

### 主题更新

由于使用了 Git 子模块，更新主题非常简单：

```bash
git submodule update --remote --merge
```

## 总结

搭建一个 Hugo 博客并不复杂，主要步骤包括：

1. **安装 Hugo** - 根据系统选择安装方式
2. **创建站点** - `hugo new site myblog`
3. **选择主题** - 使用 Git 子模块添加主题
4. **配置站点** - 编辑 `config.toml` 文件
5. **创建内容** - 使用 `hugo new` 命令创建页面和文章
6. **本地测试** - `hugo server -D` 预览效果
7. **部署上线** - 使用脚本部署到 GitHub Pages

整个过程中最花时间的可能是主题的选择和配置，但一旦完成，写作和发布就变得非常顺畅。Hugo 的快速生成速度让写作体验很好，几乎感觉不到等待时间。

我的博客现在已经上线运行，后续计划添加更多功能，比如文章分类、标签云、RSS 订阅等。如果你也打算搭建个人博客，希望这篇文章对你有帮助。

如果有任何问题，欢迎在评论区留言讨论。Happy blogging！

