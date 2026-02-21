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

If you add routes at runtime, you will have to add them within a callback to ensure they are added during development.

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
  // production
  addRedirects()
}
```

This is **optional**, you can also just reload the page.
