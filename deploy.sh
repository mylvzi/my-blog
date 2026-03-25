#!/bin/bash

echo -e "\033[0;32m部署更新到 GitHub Pages...\033[0m"

# 构建网站
hugo

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