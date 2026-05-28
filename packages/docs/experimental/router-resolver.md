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

## With Data Loaders

If you use [Data Loaders](../data-loaders/), install the plugin **before** the router:

```ts
import { DataLoaderPlugin } from 'vue-router/experimental'

app.use(DataLoaderPlugin, { router })
app.use(router)
```
