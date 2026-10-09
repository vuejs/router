# Experimental Router

::: warning
The experimental router reflects the explorations of the upcoming major version of Vue Router. It is not production-ready and should be used for testing and feedback purposes only.
:::

The experimental router introduces a new **resolver-based** matching layer that powers stronger typing, file-based routing, and **custom param parsers**.

## Installation

The experimental router lives next to the stable one and is opt-in. You import the factory from `vue-router/experimental` and a resolver (from `vue-router/auto-resolver` when using file-based routing):

```ts{3,4,8}
// src/router/index.ts
import { createWebHistory } from 'vue-router'
import { experimental_createRouter as createRouter } from 'vue-router/experimental'
import { resolver, handleHotUpdate } from 'vue-router/auto-resolver'

export const router = createRouter({
  history: createWebHistory(),
  resolver,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
```

Since the experimental router doesn't add the `<RouterLink>` and `<RouterView>` components, you need to register them globally:

```ts{3,8,9}
// src/main.ts
import { createApp } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)
app.component('RouterLink', RouterLink)
app.component('RouterView', RouterView)
app.use(router)
app.mount('#app')
```

## Opt-in to typed `useRouter()` / `useRoute()`

To get a stricter router instance type from `useRouter()`, register your router on `TypesConfig`:

```ts
// src/main.ts
declare module 'vue-router' {
  export interface TypesConfig {
    Router: typeof router
  }
}
```

## Query values are arrays

In the experimental router, every key in `route.query` has an array value. A key without a value gives `[null]`, and a missing key is `undefined`:

```ts
// /search?q=vue&tag=a&tag=b&debug
route.query.q // ['vue']
route.query.tag // ['a', 'b']
route.query.debug // [null]
route.query.page // undefined
```

When you navigate, also pass arrays. A non array value still works, but it shows a deprecation warning in development:

```ts
router.push({ query: { q: ['vue'] } }) // [!code ++]
router.push({ query: { q: 'vue' } }) // [!code --]
```

An empty array is the same as a missing key: `{ tag: [] }` and `{}` give the same location.

## Navigation and redirects

Relative string locations passed to `router.push()`, `router.replace()`, or `router.resolve()` use the current route as their base:

```ts
// Current route: /users/posva
router.push('add') // /users/add
```

Relative object locations need an explicit current location. Resolve them first, then navigate:

```ts
const target = router.resolve(
  { query: { page: ['2'] } },
  router.currentRoute.value
)
router.push(target)
```

### Navigation guard redirects

Relative redirects returned by navigation guards use the **target route (`to`)** as their base. This also applies to initial navigation and back/forward navigation:

```ts
router.beforeEach(to => {
  if (to.path === '/users/posva') return 'add'
})
// Navigating to /users/posva redirects to /users/add.
```

An object redirect without a `name` or `path` keeps the target's params, query, and hash unless the redirect overrides them:

```ts
router.beforeEach(to => {
  if (to.path === '/search' && !to.query.page) {
    return { query: { page: ['2'] } }
  }
})
// /search?q=vue#results redirects to /search?q=vue&page=2#results.
```

Named redirects and absolute paths do not inherit params, query, or hash. Supply any required params when returning a named route.

### Route record redirects

A route record's `redirect` must return a named location or an absolute path (starting with `/`). It does not inherit params, query, or hash from the navigation target or current route. Copy values from `to` when you need to keep them:

```ts
// In a page's definePage() call
definePage({
  redirect: to => ({
    path: '/search',
    query: to.query,
    hash: to.hash,
  }),
})
```

## Path overrides are not supported

With file-based routing, the experimental router builds the path matcher of each route from the file name. Do not change the `path` of a route with `definePage()`, the `<route>` custom block, or `extendRoute()`. The plugin shows the `VUE_ROUTER_B0025` warning when it generates `vue-router/auto-resolver` for a route with a path override.

To change the path, rename the file. To add more paths to a route, use `alias`:

```vue
<script setup lang="ts">
// src/pages/users/[id].vue
definePage({
  // path: '/people/:id', // not supported
  alias: ['/people/:id'],
})
</script>
```

## With Data Loaders

If you use [Data Loaders](../data-loaders/), install the plugin **before** the router:

```ts
import { DataLoaderPlugin } from 'vue-router/experimental'

app.use(DataLoaderPlugin, { router })
app.use(router)
```
