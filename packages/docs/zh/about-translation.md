# 关于中文翻译

这里是 Vue Router 文档的中文翻译，该翻译由 Vue 社区贡献完成，如对翻译有任何疑问，可在我们的 GitHub 仓库创建 issue 或 pull request。谢谢。

## 协作指南

在参与翻译之前，请移步这里了解翻译的基本流程和注意事项：

https://github.com/vuejs/router/blob/main/.github/contributing.md#contributing-docs

如果想快速了解待更新的内容，可以访问此链接查阅 `packages/docs/` 部分的更新：

https://github.com/vuejs/router/compare/docs-sync-zh...main

如果想快速了解待翻译的内容，可以访问此链接查阅 `packages/docs/zh/` 部分的更新：

https://github.com/search?q=repo%3Avuejs%2Frouter+path%3Apackages%2Fdocs%2Fzh+TODO%3A+translation&type=code

## 翻译须知

首先，Vue Router 文档的中文翻译遵循 Vue 主站的翻译须知。详见：

https://github.com/vuejs-translations/docs-zh-cn/wiki/%E7%BF%BB%E8%AF%91%E9%A1%BB%E7%9F%A5

其次，针对 Vue Router 本身的特殊语境，我们在上述翻译须知的基础上整理了一份附加的术语约定：

| 英文 | 建议翻译 |
| --- | --- |
| active (link) | 匹配当前路由 (的链接) |
| exact active (link) | 严格匹配当前路由 (的链接) |
| location | 地址 |
| (nagivate) from | (导航) 离开 |
| (nagivate) to | (导航) 进入 |
| (navigation) guard | (导航) 守卫 |
| path | 路径 |

## 中文格式校验

我们使用 [zhlint](https://www.npmjs.com/package/zhlint) 对中文翻译的格式进行校对，用法可参考以下命令：

```bash
pnpm add -g zhlint
zhlint "./packages/docs/zh/**/*.md"
```
