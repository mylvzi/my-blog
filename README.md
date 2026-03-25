# 我的 Hugo 博客

这是一个使用 Hugo 静态网站生成器创建的博客项目。

## 项目结构

```
├── archetypes
│   └── default.md
├── config.toml
├── content
│   └── posts
│       ├── hello-world.md
│       ├── hugo-single-link.md
│       └── huo-zha-le.md
├── static
│   ├── images
│   └── photos
└── themes
    └── hyde
```

## 快速开始

### 前提条件

- 安装 [Hugo](https://gohugo.io/installation/)
- Git（已安装）

### 安装主题

主题已作为 Git 子模块添加。首次克隆此仓库后，运行：

```bash
git submodule update --init --recursive
```

### 本地开发

启动 Hugo 本地服务器：

```bash
hugo server -D
```

然后在浏览器中打开 http://localhost:1313

### 创建新文章

```bash
hugo new posts/我的新文章.md
```

### 构建静态网站

```bash
hugo
```

生成的网站文件在 `public/` 目录中。

## 配置

编辑 `config.toml` 文件来自定义博客设置：

- `baseURL`: 网站部署后的基础 URL
- `title`: 博客标题
- `theme`: 使用的主题（当前为 hyde）

## 主题

当前使用的是 [Hyde](https://github.com/spf13/hyde) 主题，一个简洁的两栏式 Hugo 主题。

## 部署

可以将 `public/` 目录的内容部署到任何静态网站托管服务，如：

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

## 许可证

MIT