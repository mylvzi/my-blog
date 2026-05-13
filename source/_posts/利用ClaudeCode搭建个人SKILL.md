---
title: "利用ClaudeCode搭建个人SKILL"
date: 2026-05-13 16:59:11
tags:
  - "技术"
  - "自动化"
categories:
  - "教程分享"
comment: true
summary: "最近SKILL很火,结合网上资源搭建了一个自己的SKILL,跟大家分享下 0.前提&背景 前提 需求背景 一.安装Skill Creator 介绍: Anthropic 官方出品，能够自动写 skil..."
---
>最近SKILL很火,结合网上资源搭建了一个自己的SKILL,跟大家分享下

# 0.前提&背景
`前提`
```
1.环境: WIN 11
2.已安装好ClaudeCode并能成功启动
3.安装obsidian
```
`需求背景`
```
1.经常看阮一峰老师的博客,有很多有意思的文章分享,希望保存到本地(https://www.ruanyifeng.com/blog/weekly/)
2.利用AI自动判断文章类型, 创建摘要自动保存到obsidian对应的文件夹下
```

# 一.安装Skill-Creator
>介绍: Anthropic 官方出品，能够自动写 skill 的 skill。
>地址: https://github.com/anthropics/skills/tree/main/skills/skill-creator

**安装方式**
```
1.打开claude对话框
2.输入: 帮我安装下skill,地址是:https://github.com/anthropics/skills/tree/main/skills/skill-creator
3.等待安装完毕
```
安装完成之后输入: `/skills`,可以在下方skill列表找到刚才安装的skill-creator
![Pasted image 20260213161117](/images/posts/claudecode-skill/img_01.png)
# 二.基于skill-creator配置定制化skill
首先在obsidian中创建好对应的目录:
![Pasted image 20260213161215](/images/posts/claudecode-skill/img_02.png)
直接输入:
```
根据以下需求，帮我创建一个 skill： 
skill 的要求 
触发条件 1. 只有当我以 "ryf:" 开头，你才可以使用这个 skill 
2. skill 命名为：ryfblogskill 

我的需求 
1. 我会先给你发送一个 http/https 连接，你需要判断这个网站的类型，具体分为以下几类： 
   - articles：技术文章 对应 lsq_learn/ryf-blog/articles 目录 
   - projects：开源项目 对应 lsq_learn/ryf-blog/projects 目录 
   - quotes：言论/观点 对应 lsq_learn/ryf-blog/quotes 目录 
   - techNews：科技新闻 对应 lsq_learn/ryf-blog/techNews 目录 
   - resources：资源/教程 对应 lsq_learn/ryf-blog/resources 目录 
1. 判断完类型后，选定对应类型，读取并解析该网站内容，在 Obsidian 对应的目录下输出内容（创建对应的 md 文件并保存）。输出内容要求： 
   - md 命名规则：articles-xxx（文章标题）（注：xxx 替换为实际文章标题，其他类型同理） 
   - md 内容要求： 
     1. 粘贴该网站的具体链接 
     2. 总结该网站的核心内容（字数控制在 50-150 字）
```
等待创建完成, 输入`/skills`查看创建好的skill
![Pasted image 20260213162136](/images/posts/claudecode-skill/img_03.png)
* **注**: 上述描述话语可自定义修改
# 三.验证结果
输入:ryf:https://egghead.io/blog/using-branded-types-in-typescript
![Pasted image 20260213162352](/images/posts/claudecode-skill/img_04.png)
![Pasted image 20260213162508](/images/posts/claudecode-skill/img_05.png)
去obsidian中查看
![Pasted image 20260213162624](/images/posts/claudecode-skill/img_06.png)
可见保存成功!
# 四.总结

AI带来的效率革命令人惊叹, 每个人都应该使用AI将自己打造为一个`超级个体`, 很赞同一位大佬的观点:`任何可复用的技能，都建议 Skill 化`
# 五.补充(一些claude技巧)
`查看历史对话`: [命令行关掉以后，Claude Code 的 chat history 到哪去了_claude code 历史记录-CSDN博客](https://blog.csdn.net/i042416/article/details/154876003)
参考:
1. [火爆全网的 Agent Skills，普通人到底该怎么用？-- 详细教程 · 测试之家](https://testerhome.com/topics/43544)
2. [(46 封私信 / 80 条消息) 2026 最新 Claude Skills 保姆级教程及实践！ - 知乎](https://zhuanlan.zhihu.com/p/1996724780209047225)