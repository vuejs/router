# 安装

## 直接下载 / CDN

[https://unpkg.com/vue-router@4](https://unpkg.com/vue-router@4)

<!--email_off-->

[Unpkg.com](https://unpkg.com) 提供了基于 npm 的 CDN 链接。上述链接将始终指向 npm 上的最新版本。 你也可以通过像 `https://unpkg.com/vue-router@4.0.15/dist/vue-router.global.js` 这样的 URL 来使用特定的版本或 Tag。

<!--/email_off-->

这将把 Vue Router 暴露在一个全局的 `VueRouter` 对象上，例如 `VueRouter.createRouter(...)`。

## 包管理器

对于一个现有的使用 JavaScript 包管理器的项目，你可以从 npm registry 中安装 Vue Router：

::: code-group

```bash [npm]
npm install vue-router@4
```

```bash [yarn]
yarn add vue-router@4
```

```bash [pnpm]
pnpm add vue-router@4
```

:::

如果你打算启动一个新项目，你可能会发现使用 [create-vue](https://github.com/vuejs/create-vue) 这个脚手架工具更容易，它能创建一个基于 Vite 的项目，并包含加入 Vue Router 的选项：

::: code-group

```bash [npm]
npm create vue@latest
```

```bash [yarn]
yarn create vue
```

```bash [pnpm]
pnpm create vue
```

:::

你需要回答一些关于你想创建的项目类型的问题。如果您选择安装 Vue Router，示例应用还将演示 Vue Router 的一些核心特性。

使用包管理器的项目通常会使用 ES 模块来访问 Vue Router，例如 `import { createRouter } from 'vue-router'`。
