@echo off
echo 部署更新到 GitHub Pages...

REM 构建网站
hugo

REM 进入 public 目录
cd public

REM 添加更改
git add .

REM 提交更改
set msg=更新内容 %date% %time%
if not "%*"=="" set msg=%*
git commit -m "%msg%"

REM 推送到远程仓库
git push origin master

REM 回到项目根目录
cd ..

echo 部署完成！
pause