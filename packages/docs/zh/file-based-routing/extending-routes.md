# 扩展路由

## 在配置中扩展路由

你可以使用 `extendRoute` 或 `beforeWriteFiles` 选项在构建时扩展路由。两者都可以返回 Promise：

```ts
import VueRouter from 'vue-router/vite'
import path from 'node:path'

VueRouter({
  extendRoute(route) {
    if (route.name === '/[name]') {
      route.addAlias('/hello-vite-:name')
    }
  },

  beforeWriteFiles(root) {
    root.insert('/from-root', path.join(__dirname, './src/pages/index.vue'))
  },
})
```

这样修改的路由将反映在生成的 `typed-router.d.ts` 文件中。

## 组件内路由

可以直接在页面组件文件中覆盖路由配置。插件会拾取这些更改并反映在生成的 `typed-router.d.ts` 文件中。

### `definePage()`

你可以使用 `definePage()` 宏修改和扩展任何页面组件。这对于添加 meta 信息或修改路由对象很有用。它在 Vue 组件中全局可用，但如果需要，你可以从 `vue-router` 导入它。

```vue{2-7}
<script setup lang="ts">
definePage({
  alias: ['/n/:name'],
  meta: {
    requiresAuth: true,
  },
})
</script>

<template>
  <!-- ... -->
</template>
```

如果你使用 ESLint，你需要 [将其声明为全局变量](./eslint#definepage)。

::: danger
你不能在 `definePage()` 中使用变量，因为它传递的参数在构建时被提取并从 `<script setup>` 中删除。类似于 Nuxt 中的其他宏，如 `definePageMeta()`。
:::

### SFC `<route>` 自定义块

`<route>` 自定义块是一种扩展现有路由的方法。它可用于添加新的 `meta` 字段，覆盖 `path`、`name` 或路由中的任何其他内容。**它必须添加到 [路由文件夹](./file-based-routing#路由文件夹结构) 内的 `.vue` 组件中**。它类似于 [vite-plugin-pages 中的相同功能](https://github.com/hannoeru/vite-plugin-pages#sfc-custom-block-for-route-data) 以方便迁移。

```vue
<route lang="json">
{
  "name": "name-override",
  "meta": {
    "requiresAuth": false
  }
}
</route>
```

注意你可以使用 `<route lang="yaml">` 指定要使用的语言。默认情况下，语言是 JSON5（更灵活的 JSON 版本），但也支持 yaml 和 JSON。

## 在运行时扩展路由

作为一种权宜之计，可以在**运行时**通过简单地更改或克隆 `routes` 数组并将其传递给 `createRouter()` 之前扩展路由。由于这些更改是在运行时进行的，因此它们不会反映在生成的 `typed-router.d.ts` 文件中。

```js{4-9}
import { createWebHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

for (const route of routes) {
  if (route.name === '/admin') {
    route.meta ??= {}
    route.meta.requiresAuth = true
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes,
})
```

::: warning
在运行时添加的路由 [需要特殊处理 HMR](./hmr#运行时路由)。
:::

随着此插件的发展，这种情况应该越来越少，并且只在特定场景下才需要。

一个例子是使用 [vite-plugin-vue-layouts](https://github.com/JohnCampionJr/vite-plugin-vue-layouts)，它只能这样使用：

```ts
import { createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { setupLayouts } from 'virtual:generated-layouts'

const router = createRouter({
  // ...
  routes: setupLayouts(routes),
})
```

另一个例子是向路由器添加 _重定向_ 记录：

```ts
import { routes } from 'vue-router/auto-routes'

routes.push({
  path: '/path-to-redirect',
  redirect: '/redirected-path',
})

routes.push({
  path: '/path-to-redirect/:id',
  redirect: to => `/redirected-path/${to.params.id}`,
})
```

仅在运行时添加重定向的一个好处是它们不会反映在生成的 `typed-router.d.ts` 中，不会出现在自动完成中，但当用户输入 URL 或点击链接时仍然会按预期工作。
