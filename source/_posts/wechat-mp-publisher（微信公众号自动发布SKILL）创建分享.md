---
title: wechat-mp-publisher（微信公众号自动发布SKILL）创建分享
date: 2026-05-13 16:41:20
tags:
  - 微信公众号
  - 自动化
  - Skill
categories:
  - 教程分享
comment: true
summary: 需求： 1. 利用 claude 将本地 md 文件自动发布到微信公众号草稿箱（无法直接发布） 本文主要内容： 过程分享以及踩坑指南 零. 前言 微信公众号编辑器渲染的方式是 html，一直都是使用...
---
> 需求：
> 1. 利用 claude 将本地 md 文件自动发布到微信公众号草稿箱（无法直接发布）
> 本文主要内容： 过程分享以及踩坑指南

# 零. 前言
微信公众号编辑器渲染的方式是 html，一直都是使用 `https://github.com/Spute/obsidian-copy-to-mp` 将本地 md手动复制到微信公众号编辑页面，还要填写标题，作者，选择封面图片等操作，效率很低，今天探索使用 skill-creator 将整个操作封装为 skill

---
# 一. 利用 skill-creator 以对话的方式创建 skill
> 首先获取微信公众号的 Appid 和 AppSecret

进入： [微信开发者平台](https://developers.weixin.qq.com/console/index?tab1=business&tab2=dev)，点击我的业务--》公众号
![Pasted image 20260214183527](/images/posts/wechat-mp-publisher-skill/img_01.png)
![Pasted image 20260214183658](/images/posts/wechat-mp-publisher-skill/img_02.png)

> 打开 ClaudeCode，输入以下内容
```text
帮我创建一个skill，基本功能是自动把本地md文件发送到微信公众号草稿箱，我的微信公众号appid：（替换为自己的），appsecret：（替换为自己的）
```
他会帮你创建好对应的 python 脚本和 skill，但由于微信公众号 API 的限制，需要手动配置一些信息，接下来是和 cc 多轮对话过程中需要手动配置的内容
![Pasted image 20260214183853](/images/posts/wechat-mp-publisher-skill/img_03.png)

---
# 二. 手动配置
## 配置 1：配置 IP 白名单
**报错背景：**
![Pasted image 20260214191130](/images/posts/wechat-mp-publisher-skill/img_04.png)

**配置方式：** 回到此页面，在【开发者密钥】中配置 IP 白名单
![Pasted image 20260214184229](/images/posts/wechat-mp-publisher-skill/img_05.png)

---
## 配置 2：thumb_media_id 配置
**报错背景：**
![Pasted image 20260214191223](/images/posts/wechat-mp-publisher-skill/img_06.png)
`thumb_media_id`：封面图片素材 id，微信公众号的文章都必须配置封面图片

**配置方式：**
>  主要依赖于两个接口
>  1. GetAccessToken：获取 token
>  2. AddMaterial：将图片上传到公众号素材库
> AddMaterial  接口 `依赖于` getAccessToken 的返回值

### Step 1：获取 access_token
> getAccessToken：
> 作用：本接口用于获取获取全局唯一后台接口调用凭据（Access Token）
> 链接：[基础接口 / 获取接口调用凭据](https://developers.weixin.qq.com/doc/subscription/api/base/api_getaccesstoken.html)
![Pasted image 20260214185141](/images/posts/wechat-mp-publisher-skill/img_07.png)
### Step 2：上传图片
此处为了方便直接使用 curl 命令完成上传
```
curl -F "media=@/path/to/image.png" "https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=ACCESS_TOKEN&type=thumb"
```
* media=@：后面拼接本地要上传的图片路径
* access_token：替换为上一步复制的值

```json
{
  "media_id": "xxx",
  "url": "http://xxx",
  "item": []
}
```
* media_id 就是 thumb_media_id, 复制此字段的值
### （非必须）Step 3：验证上传成功
> getMaterial：
> 作用：本接口用于根据media_id获取永久素材的详细信息
> 链接：[素材管理 / 永久素材 / 获取永久素材](https://developers.weixin.qq.com/doc/subscription/api/material/permanent/api_getmaterial.html)

![Pasted image 20260214190819](/images/posts/wechat-mp-publisher-skill/img_08.png)

---
# 三. 验证
![Pasted image 20260214191245](/images/posts/wechat-mp-publisher-skill/img_09.png) ![Pasted image 20260214191352](/images/posts/wechat-mp-publisher-skill/img_10.png)

吐槽：微信的接口文档维护的太差了，入口难找，接口文档写的也一般...
注：完整的 SKILL. md 和主要脚本可后台私信

---
# 四. 进化（适配 obsidian）
![Pasted image 20260214195154](/images/posts/wechat-mp-publisher-skill/img_11.png)
上面生成的 SKILL 针对 obsidna 中图片路径的转换不是很好，在草稿箱中无法展示图片，正当我发愁时，突然想到我一直在用的工具：`https://github.com/Spute/obsidian-copy-to-mp`（最开始提到的），这个工具就可以实现 `在obsidian中直接复制，粘贴到微信公众号编辑器中可正常展示图片`，直接把此仓库喂给 cc，让他自己调整 SKILL 和脚本
![Pasted image 20260214195003](/images/posts/wechat-mp-publisher-skill/img_12.png) ![Pasted image 20260214195021](/images/posts/wechat-mp-publisher-skill/img_13.png)
如果可以的话，请支持下：`https://github.com/Spute/obsidian-copy-to-mp` 作者！