# Vapor Mode

[Vapor Mode](https://vuejs.org/guide/extras/vapor-mode) apps (Vue 3.6+) need the Vapor versions of `<RouterLink>` and `<RouterView>`. Import them from `vue-router/vapor`:

```ts
import { VaporRouterLink, VaporRouterView } from 'vue-router/vapor'
```

## Registering the components

`createRouter()` registers the VDOM `<RouterLink>` and `<RouterView>` components, except in Vapor apps. Register the Vapor ones yourself:

```ts{2,8,9}
import { createVaporApp } from 'vue'
import { VaporRouterLink, VaporRouterView } from 'vue-router/vapor'
import App from './App.vue'
import { router } from './router'

const app = createVaporApp(App)
app.use(router)
app.component('RouterLink', VaporRouterLink)
app.component('RouterView', VaporRouterView)
app.mount('#app')
```

## Differences with the VDOM components

- Vapor Mode doesn't support the Options API: `$router` and `$route` are not available in templates. Use `useRouter()` and `useRoute()` instead.
- In the `<RouterView>` slot, `Component` is the route component instance. Render it with `<component :is="Component" />`. Props and slots passed to `<component>` are ignored: [pass props from the route](../essentials/passing-props) instead. Template refs work.

## SSR

Vapor components only run in the browser. The server renders the VDOM `<RouterLink>` and `<RouterView>`, and the client hydrates that HTML with the Vapor ones.

With `createRouter()`, the server app is a VDOM app, so the router registers the VDOM components there. Register the Vapor components on the client only:

```ts
const app = import.meta.env.SSR ? createSSRApp(App) : createVaporSSRApp(App)
app.use(router)
if (!import.meta.env.SSR) {
  app.component('RouterLink', VaporRouterLink)
  app.component('RouterView', VaporRouterView)
}
```

The [experimental router](../../experimental/router-resolver) doesn't register any component: pick the components for each environment, like the history:

```ts
import { createSSRApp, createVaporSSRApp } from 'vue'
import {
  createMemoryHistory,
  createWebHistory,
  RouterLink,
  RouterView,
} from 'vue-router'
import { experimental_createRouter as createRouter } from 'vue-router/experimental'
import { VaporRouterLink, VaporRouterView } from 'vue-router/vapor'
import { resolver } from 'vue-router/auto-resolver'
import App from './App.vue'

export function createApp() {
  const router = createRouter({
    history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
    resolver,
  })
  const app = import.meta.env.SSR ? createSSRApp(App) : createVaporSSRApp(App)
  app.component(
    'RouterLink',
    import.meta.env.SSR ? RouterLink : VaporRouterLink
  )
  app.component(
    'RouterView',
    import.meta.env.SSR ? RouterView : VaporRouterView
  )
  app.use(router)
  return { app, router }
}
```
