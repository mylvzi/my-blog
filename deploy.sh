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

# 初始化git仓库如果不存在
if [ ! -d ".git" ]; then
    echo "Initializing git repository in public directory..."
    git init
    git remote add origin https://github.com/mylvzi/my-blog.git
    git checkout -b gh-pages
fi

# 添加更改
git add .

# 提交更改
msg="更新内容 $(date)"
if [ -n "$*" ]; then
    msg="$*"
fi
git commit -m "$msg"

# 推送到远程仓库
git push origin gh-pages --force

# 回到项目根目录
cd ..

echo -e "\033[0;32m部署完成！\033[0m"