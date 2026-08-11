# Hot Module Replacement

When using `definePage()` and `<route>` blocks, it's possible to enable Hot Module Replacement (HMR) for your routes **and avoid the need of reloading the page or the server** when you make changes to your routes.

Enabling HMR is **strongly recommended** and currently **only works with Vite**.

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

// This will update routes at runtime without reloading the page
if (import.meta.hot) { // [!code ++]
  handleHotUpdate(router) // [!code ++]
} // [!code ++]
```

## Runtime routes

If you add routes at runtime, you will also have to add them within a callback to ensure they are re-added when the routes are hot-updated. `handleHotUpdate()` only runs the callback on updates, not on the initial load, so keep the regular call as well.

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

addRedirects()

if (import.meta.hot) {
  // routes added at runtime are lost when routes are hot-updated
  // so they need to be re-added after each update
  handleHotUpdate(router, (newRoutes) => { // [!code ++]
    addRedirects() // [!code ++]
  }) // [!code ++]
}
```

This is **optional**, you can also just reload the page.
