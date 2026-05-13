---
title: MapToPoster-用代码将城市地图转换为精美的海报设计
date: 2026-05-13 16:10:00
tags:
  - Python
  - 开源项目
  - 地图可视化
categories:
  - 教程分享
comment: true
summary: 介绍开源项目 MapToPoster 的安装方式和基础用法，用代码将城市地图生成极简风格海报。
---

> Transform your favorite cities into beautiful, minimalist designs. MapToPoster lets you create and export visually striking map posters with code.
> 将你喜爱的城市转变为美丽、极简的设计。MapToPoster 允许你用代码创建并导出视觉冲击力强的地图海报。

链接：https://github.com/originalankur/maptoposter

# 安装方式
```
1. 克隆项目 
git clone https://github.com/originalankur/maptoposter.git cd maptoposter 
2. 安装依赖 
pip install -r requirements.txt
```
# 快速使用
```python
python create_map_poster.py -c "Zhengzhou" -C "China" -t neon_cyberpunk -d 100000
```
* `-c（--city）`：City name  城市名称
* `-C（--country）`：Country name  国家名称
* `-t（--theme）`：指定风格
* `-d（--distance）`：地图半径

![Pasted image 20260223113723](/images/posts/maptoposter-city-map-poster/img_01.png)
生成结果
![91354b183e1facc46272944635cf357](/images/posts/maptoposter-city-map-poster/img_02.png)

```python
python create_map_poster.py -c "Changchun" -C "China" -t copper_patina -d 100000
```
![e571993b292a33de4c4272cc60c0af8](/images/posts/maptoposter-city-map-poster/img_03.png)
