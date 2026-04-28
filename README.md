
## Lvzi' s Blog

个人博客源码仓库，基于 [Hexo](https://github.com/hexojs/hexo) 和 [hexo-theme-stellar](https://github.com/xaoxuu/hexo-theme-stellar) 构建。

### 本地开发

```bash
npm install
npm run start
```

### 构建

```bash
npm run build
```

### 部署

仓库根目录提供 `deploy.bat`：

```bat
deploy.bat
```

脚本会先构建站点，再提交源码仓库 `main` 分支，由 GitHub Actions 自动发布到 `mylvzi.github.io`。
