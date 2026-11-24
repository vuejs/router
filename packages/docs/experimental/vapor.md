# Vapor Mode

::: warning
The Vapor components are experimental. They need Vue 3.6 or later. Their API can change in minor versions.
:::

Vapor Mode apps need Vapor versions of `<RouterLink>` and `<RouterView>`. Import them from `vue-router/experimental/vapor`:

```ts
import { RouterLink, RouterView } from 'vue-router/experimental/vapor'
```

They have the same props, slots, and behavior as the [experimental `<RouterLink>`](./router-resolver) and the regular `<RouterView>`. They work with both `createRouter()` and `experimental_createRouter()`.

## Registering the components

Register the Vapor components yourself. In Vapor apps (`createVaporApp()` and `createVaporSSRApp()`), `createRouter()` does not register the VDOM components.

```ts{2,7,8,9}
import { createVaporApp } from 'vue'
import { RouterLink, RouterView } from 'vue-router/experimental/vapor'
import App from './App.vue'
import { router } from './router'

const app = createVaporApp(App)
app.use(router)
app.component('RouterLink', RouterLink)
app.component('RouterView', RouterView)
app.mount('#app')
```

## Differences with the VDOM components

- Vapor Mode has no Options API: `$router` and `$route` are not available in templates, and `beforeRouteEnter`, `beforeRouteUpdate`, and `beforeRouteLeave` component options are not called. Use `useRouter()`, `useRoute()`, `onBeforeRouteUpdate()`, and `onBeforeRouteLeave()` instead.
- In the `<RouterView>` slot, `Component` is the route component instance. Render it with `<component :is="Component" />`. Props and slots passed to `<component>` are ignored: [pass props from the route](../guide/essentials/passing-props) or use the attributes of `<RouterView>` instead. Template refs, `:key`, `<KeepAlive>`, and `<Transition>` work.
- VDOM route components render through `vaporInteropPlugin`. Without it, every route component must be a Vapor component.
