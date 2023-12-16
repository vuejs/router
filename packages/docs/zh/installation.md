# 安装

## 直接下载 / CDN

[https://unpkg.com/vue-router@4](https://unpkg.com/vue-router@4)

<!--email_off-->

[Unpkg.com](https://unpkg.com) 提供了基于 npm 的 CDN 链接。上述链接将始终指向 npm 上的最新版本。 你也可以通过像 `https://unpkg.com/vue-router@4.0.15/dist/vue-router.global.js` 这样的 URL 来使用特定的版本或 Tag。

<!--/email_off-->

<!-- TODO: translation -->

This will expose Vue Router via a global `VueRouter` object, e.g. `VueRouter.createRouter(...)`.

## Package managers

If you have an existing project that uses a JavaScript package manager, you can install Vue Router from the npm registry:

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

If you're starting a new project, you might find it easier to use the [create-vue](https://github.com/vuejs/create-vue) scaffolding tool, which creates a Vite-based project with the option to include Vue Router:

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

You'll be prompted with some questions about the kind of project you want to create. If you choose to install Vue Router, the example application will also demonstrate some of Vue Router's core features.

Projects using package managers will typically use ES modules to access Vue Router, e.g. `import { createRouter } from 'vue-router'`.
