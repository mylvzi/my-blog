# GitBook 迁移说明

本仓库已从 Hexo/Stellar 的运行时站点迁移为 GitBook 内容仓库，以匹配 [TsingJyujing/blogs](https://github.com/TsingJyujing/blogs) 的工程架构。

## 当前结构

- `docs/README.md`：站点首页。
- `docs/SUMMARY.md`：GitBook 左侧目录的唯一来源。
- `docs/<栏目>/README.md`：栏目入口页。
- `docs/<栏目>/*.md`：独立文章，首个 H1 是页面标题。
- `docs/.gitbook/assets/`：所有内容图片和项目资源。
- `.gitbook.yaml`：GitBook Git Sync 配置及旧路径映射；它将内容根限制为 `docs/`。
- `.legacy/hexo/`：原 Hexo 工程的完整备份，不参与 GitBook 同步。

## 发布

参考站的界面由 GitBook Cloud 提供，而不是仓库中的 CSS。请在 GitBook 创建一个 Space，选择 **Set up Git Sync**，连接 `mylvzi/my-blog` 的 `main` 分支，并在首次同步时选择 **GitHub → GitBook**。GitBook 会读取根目录的 `.gitbook.yaml`，随后只同步 `docs/` 中的 `README.md` 与 `SUMMARY.md`。

GitBook Git Sync 配置参考：[Content configuration](https://gitbook.com/docs/getting-started/git-sync/content-configuration) 和 [GitHub Sync](https://gitbook.com/docs/getting-started/git-sync/enabling-github-sync)。

原 `mylvzi.github.io` 与新的 GitBook 域名不同；`.gitbook.yaml` 中的 redirect 只会在新的 GitBook 域名上生效。如需让旧 GitHub Pages 链接继续跳转，需要保留旧站作为跳转页，或在自有域名 / 边缘规则中配置跨域跳转。

## 新增内容

1. 在 `docs/` 下的合适栏目中新建 Markdown，首行写 `# 文章标题`。
2. 图片放入 `docs/.gitbook/assets/<主题>/`，在正文中使用相对路径。
3. 将新页加入 `docs/SUMMARY.md`；也可运行 `python3 docs/gen_summary.py` 后检查生成目录并按需要调整顺序。
