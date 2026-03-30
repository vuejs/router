# 热更新

当使用 `definePage()` 和 `<route>` 块时，可以为你的路由启用热更新 (HMR)，**在你对路由进行更改时避免重新加载页面或服务器**。

**强烈建议**启用 HMR，目前**仅适用于 Vite**。

<!-- prettier-ignore -->
```ts [src/router.ts]
import { createRouter, createWebHistory } from 'vue-router'
import {
  routes,
  handleHotUpdate, // [!code ++]
} from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 这将在运行时更新路由而无需重新加载页面
if (import.meta.hot) { // [!code ++]
  handleHotUpdate(router) // [!code ++]
} // [!code ++]
```

## 运行时路由

如果你在运行时添加路由，你需要在回调中添加它们以确保它们在开发期间被添加。

<!-- prettier-ignore -->
```ts [src/router.ts]
import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

function addRedirects() {
  router.addRoute({
    path: '/new-about',
    redirect: '/about?from=/new-about',
  })
}

if (import.meta.hot) {
  handleHotUpdate(router, (newRoutes) => { // [!code ++]
    addRedirects() // [!code ++]
  }) // [!code ++]
} else {
  // 生产环境
  addRedirects()
}
```

这是**可选的**，你也可以只是重新加载页面。
