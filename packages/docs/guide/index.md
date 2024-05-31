# Getting Started

<VueSchoolLink
href="https://vueschool.io/courses/vue-router-4-for-everyone"
title="Learn how to build powerful Single Page Applications with the Vue Router on Vue School">Watch a Free Vue Router Video Course</VueSchoolLink>

Vue Router is the official client-side routing solution for Vue.

Client-side routing is used by single-page applications (SPAs) to tie the browser URL to the content seen by the user. As users navigate around the application, the URL updates accordingly, but the page doesn't need to be reloaded from the server.

Vue Router is built on Vue's component system. You configure **routes** to tell Vue Router which components to show for each URL path.

::: tip Prerequisites
This guide will assume that you are already familiar with Vue itself. You don't need to be a Vue expert, but you may occasionally need to refer back to [the core Vue documentation](https://vuejs.org/) for more information about certain features.
:::

## An example

To introduce some of the main ideas, we're going to consider this example:

- [Vue Playground example](https://play.vuejs.org/#eNqFVVtv2zYU/itn6gArmC05btEHTXXTFcWyYZeiLfYy7UGWji02EsmRlOPA8H/fIambnaRD4Fg61++c7yN9DJqc8eirDpKANVIoA0coFOYG30kJJ9gq0cBs3+Is412AEq1B1Xmi2L+ObpvX+3IpI5+b8aFqSJ+rjANErcbQp/v3RrTchLMXlDa7CuZBl07YUoONrCl/bQPT6np9i3UtbLPv0phenVm6L3rQRgm+W79vlULeIQaZmypJ484HxyN87xzRtq3rj+SE08mViX2dlOf7vuAnh/I3xu/AiDdZEGfB+mdBz3ArGkzj0f9sRr4hy5D2zr49ykvjvmdqeTmv9RfDe4i7uM6dxsNiaF9+l0+y+Ts2Qj3cMm3oa94Zfd0py4uBzYFPO6Br3ZPaGzpme9rtQGdxg2WUgOC6Y0PDG/jbjnL0vMAsnhEsQcU4UZaMbU/z8zC3x/PYsbcN/ueilaJW03nDoy1Y+VUkT+0nvHI9PVB6PJE8M44HN2iJ27yt+9q09ek+rFR1oZg0RM5FgmvboKlEqRP/BrATX4SDH171JgBD4CIvThXJVldhP7Y7J9DtxP4nxZKk+470cnFQVuseHh2TlTduWmMEh5uiZsUdSXPAcKlOH/hIZmfEjhODRtPaozNKjyiiGcqn75Ej0Pl3lMyHp2fFeMHnEB/SRia+ict6ep/GXBWV1UGHyGtgh5O1K0KvuC8T/duieoi6tLdvYUYg+rXTmKH3jLmeKoW0owLDI7h8IrnvfAKrIargxfQ/lA0LHjmr8w3W3X3w2dVMIGWchoH9ohEl1pFRrCE2fccsgCY/1Mh3piLjaknc+pujr3TOqedk0eSSrg/BiVU3WtY5dBYMks2CkRtrzoLKGKmTOG65vNtFtON4jLh5Fb2MlnFJJ2tijVA3i40S99rdV1ngNmtr31BQXOLeCFHrRS7Zcy0eBd68jl5H13HNNjFVjxkv8eBq94unMY0mQWzZ7mJIKwtWo/pTGkaCORs2p9+Z+1+dzagWB6BFhcXdE/av+uAhf1RI0+1xMpzJFWnOuz98/gMP9Dw4icW2puhvOD+hFnVrMfqwn1peEuxJnEP7i+OM8d0X/eFgkOt+KAt0FLIj8v03Rh/hvoxeTbaozUONOiq0/aGhX6w5aY1xn7cRqkSVwEoegMCyEl4sl8sf3d1H5RhfbATdKk0C10t5cHaZlyWBHSzUJeNUFtaQww/08Tenz65xSzf+NLJaTTuP5UcARVFMACSwpL9VVyE4/QesCg/V)

Let's start by looking at the root component, `App.vue`.

### App.vue

```vue
<template>
  <h1>Hello App!</h1>
  <p>
    <strong>Current route path:</strong> {{ $route.fullPath }}
  </p>
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <RouterLink to="/about">Go to About</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>
```

This template is using two components provided by Vue Router, `RouterLink` and `RouterView`.

Instead of using regular `<a>` tags, we use the custom component `RouterLink` to create links. This allows Vue Router to change the URL without reloading the page, handle URL generation, encoding, and various other features. We'll go into more detail about `RouterLink` in later sections of the guide.

The `RouterView` component tells Vue Router where to render the current **route component**. That's the component that corresponds to the current URL path. It doesn't have to be in `App.vue`, you can put it anywhere to adapt it to your layout, but it does need to be included somewhere, otherwise Vue Router won't render anything.

The example above also uses <code v-pre>{{ $route.fullPath }}</code>. You can use `$route` in your component templates to access an object that represents the current route.

<VueMasteryLogoLink></VueMasteryLogoLink>

### Creating the router instance

The router instance is created by calling the function `createRouter()`:

```js
import { createMemoryHistory, createRouter } from 'vue-router'

import HomeView from './HomeView.vue'
import AboutView from './AboutView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/about', component: AboutView },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
```

The `routes` option defines the routes themselves, mapping URL paths to components. The component specified by the `component` option is the one that will be rendered by the `<RouterView>` in our earlier `App.vue`. These route components are sometimes referred to as _views_, though they are just normal Vue components.

Routes support various other options that we'll see later in the guide, but for now we only need `path` and `component`.

The `history` option controls how routes are mapped onto URLs and vice versa. For the Playground example we're using `createMemoryHistory()`, which ignores the browser URL entirely and uses its own internal URL instead. That works well for the Playground, but it's unlikely to be what you'd want in a real application. Typically, you'd want to use `createWebHistory()` instead, or perhaps `createWebHashHistory()`. We'll cover that topic in more detail in the guide to [History modes](./essentials/history-mode).

### Registering the router plugin

Once we've created our router instance, we need to register it as a plugin by calling `use()` on our application:

```js
createApp(App)
  .use(router)
  .mount('#app')
```

Or, equivalently:

```js
const app = createApp(App)
app.use(router)
app.mount('#app')
```

Like with most Vue plugins, the call to `use()` needs to happen before the call to `mount()`.

If you're curious about what this plugin does, some of its responsibilities include:

1. [Globally registering](https://vuejs.org/guide/components/registration.html#global-registration) the `RouterView` and `RouterLink` components.
2. Adding the global `$router` and `$route` properties.
3. Enabling the `useRouter()` and `useRoute()` composables.
4. Triggering the router to resolve the initial route.

### Accessing the router and current route

You'll likely want to access the router from elsewhere in your application.

If you're exporting the router instance from an ES module, you could import the router instance directly where you need it. In some cases this is the best approach, but we have other options if we're inside a component.

In component templates, the router instance is exposed as `$router`. This is similar to the `$route` property we saw earlier, but note the extra `r` on the end.

If we're using the Options API, we can access these same two properties as `this.$router` and `this.$route` in our JavaScript code. The `HomeView.vue` component in the Playground example accesses the router that way:

```js
export default {
  methods: {
    goToAbout() {
      this.$router.push('/about')
    },
  },
}
```

This method is calling `push()`, which is used for [programmatic navigation](./essentials/navigation). We'll learn more about that later.

With the Composition API, we don't have access to the component instance via `this`, so Vue Router includes some composables that we can use instead. `AboutView.vue` in the Playground example is using that approach:

```vue
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const search = computed({
  get() {
    return route.query.search ?? ''
  },
  set(search) {
    router.replace({ query: { search } })
  }
})
</script>
```

It's not necessary to understand all of that code right now. The key thing to notice is that the composables `useRouter()` and `useRoute()` are used to access the router instance and current route respectively.

### Next steps

If you'd like to see a complete example using Vite, you can use the [create-vue](https://github.com/vuejs/create-vue) scaffolding tool, which has the option to include Vue Router in its example project:

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

The example project created by create-vue uses similar features to the ones we've seen here. You may find that a useful starting point for exploring the features introduced in the next few pages of this guide.

## Conventions in this guide

### Single-File Components

Vue Router is most commonly used in applications built using a bundler (e.g. Vite) and [SFCs](https://vuejs.org/guide/introduction.html#single-file-components) (i.e. `.vue` files). Most of the examples in this guide will be written in that style, but Vue Router itself doesn't require you to use build tools or SFCs.

For example, if you're using the _global builds_ of [Vue](https://vuejs.org/guide/quick-start.html#using-vue-from-cdn) and [Vue Router](../installation#Direct-Download-CDN), the libraries are exposed via global objects, rather than imports:

```js
const { createApp } = Vue
const { createRouter, createWebHistory } = VueRouter
```

### Component API style

Vue Router can be used with both the Composition API and the Options API. Where relevant, the examples in this guide will show components written in both styles. Composition API examples will typically use `<script setup>`, rather than an explicit `setup` function.

If you need a refresher about the two styles, see [Vue - API Styles](https://vuejs.org/guide/introduction.html#api-styles).

### `router` and `route`

Throughout the guide, we will often refer to the router instance as `router`. This is the object returned by `createRouter()`. How you access that object in your application will depend on the context. For example, in a component using the Composition API, it can be accessed by calling `useRouter()`. With the Options API, it can be accessed using `this.$router`.

Similarly, the current route will be referred to as `route`. It can be accessed in components using `useRoute()` or `this.$route`, depending on which API the component is using.

### `RouterView` and `RouterLink`

The components `RouterView` and `RouterLink` are both [registered globally](https://vuejs.org/guide/components/registration.html#global-registration), so they don't need to be imported before using them in component templates. However, if you prefer, you can import them locally, e.g. `import { RouterLink } from 'vue-router'`.

In templates, component names can be written in either PascalCase or kebab-case. Vue's template compiler supports either format, so `<RouterView>` and `<router-view>` are usually equivalent. You should follow whatever convention is used within your project.

If you're using in-DOM templates then [the usual caveats](https://vuejs.org/guide/essentials/component-basics.html#in-dom-template-parsing-caveats) apply: component names must be written in kebab-case and self-closing tags are not supported. So rather than writing `<RouterView />`, you would need to use `<router-view></router-view>` instead.