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

## 部署到 GitHub Pages

已配置为自动部署到 `mylvzi.github.io`。首次部署已完成！

### 手动部署步骤

1. **修改配置**：确保 `config.toml` 中的 `baseURL = "https://mylvzi.github.io/"`
2. **构建网站**：运行 `hugo` 生成静态文件到 `public/` 目录
3. **部署更新**：
   ```bash
   cd public
   git add .
   git commit -m "更新内容"
   git push origin master
   ```

### 使用部署脚本

- **Linux/Mac**：运行 `./deploy.sh "提交信息"`
- **Windows**：双击 `deploy.bat` 或命令行运行 `deploy.bat`

### GitHub Pages 设置

1. 访问 https://github.com/mylvzi/mylvzi.github.io/settings/pages
2. 确保配置为：
   - Source: Deploy from a branch
   - Branch: master (或 main) → / (root)
3. 保存后等待 1-2 分钟生效

### 访问博客

- 地址：https://mylvzi.github.io
- 本地预览：`hugo server -D` → http://localhost:1313

### 后续更新

1. 编辑 `content/posts/` 目录下的文章
2. 创建新文章：`hugo new posts/文章标题.md`
3. 运行部署脚本更新网站

## 源码管理

建议将博客源码也推送到 GitHub 仓库备份：

```bash
git remote add origin <你的源码仓库地址>
git push -u origin main
```

## 许可证

MIT