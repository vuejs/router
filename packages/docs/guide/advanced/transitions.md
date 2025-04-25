# Transitions

<VueSchoolLink
  href="https://vueschool.io/lessons/route-transitions"
  title="Learn about route transitions"
/>

In order to use transitions on your route components and animate navigations, you need to use the [`<RouterView>` slot](./router-view-slot):

```vue-html
<router-view v-slot="{ Component }">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

[All transition APIs](https://vuejs.org/guide/built-ins/transition.html) work the same here.

## Per-Route Transition

The above usage will apply the same transition for all routes. If you want each route's component to have different transitions, you can instead combine [meta fields](./meta.md) and a dynamic `name` on `<transition>`:

```js
const routes = [
  {
    path: '/custom-transition',
    component: PanelLeft,
    meta: { transition: 'slide-left' },
  },
  {
    path: '/other-transition',
    component: PanelRight,
    meta: { transition: 'slide-right' },
  },
]
```

```vue-html
<router-view v-slot="{ Component, route }">
  <!-- Use a custom transition or fallback to `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

## Route-Based Dynamic Transition

It is also possible to determine the transition to use dynamically based on the relationship between the target route and current route. Using a very similar snippet to the one just before:

```vue-html
<!-- use a dynamic transition name -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition">
    <component :is="Component" />
  </transition>
</router-view>
```

We can add an [after navigation hook](./navigation-guards.md#Global-After-Hooks) to dynamically add information to the `meta` field based on the depth of the route

```js
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

## Forcing a transition between reused views

Vue might automatically reuse components that look alike, avoiding any transition. Fortunately, it is possible [to add a `key` attribute](https://vuejs.org/api/built-in-special-attributes.html#key) to force transitions. This also allows you to trigger transitions while staying on the same route with different params:

```vue-html
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

## Initial navigation and transitions

Usually, enter animations are ignored by Vue's `<Transition>` unless we add the `appear` prop. But you'll notice that, when using it alongside `<RouterView>`, transitions are **always** applied despite the `appear` prop not being set. This is because navigations are asynchronous in Vue Router, meaning that the Vue application renders once before the initial navigation is finished. There are different ways to adapt this. The easiest one is to await the initial navigation before mounting the app with [`isReady`](https://router.vuejs.org/api/interfaces/Router.html#isReady):

```ts
const app = createApp(App)
app.use(router)

// mount after the initial navigation is ready
await router.isReady()
app.mount('#app')
```

<!-- See full example [here](https://github.com/vuejs/vue-router/blob/dev/examples/transitions/app.js). -->
