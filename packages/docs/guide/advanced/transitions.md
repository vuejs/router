# Transitions

<VueSchoolLink
  href="https://vueschool.io/lessons/route-transitions"
  title="Learn about route transitions"
/>

In order to use transitions on your route components and animate navigations, you need to use the v-slot API:

```html
<router-view v-slot="{ Component }">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

[All transition APIs](https://v3.vuejs.org/guide/transitions-enterleave.html) work the same here.

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

```html
<router-view v-slot="{ Component, route }">
  <!-- Use any custom transition and  to `fade` -->
  <transition :name="route.meta.transition || 'fade'">
    <component :is="Component" />
  </transition>
</router-view>
```

## Route-Based Dynamic Transition

It is also possible to determine the transition to use dynamically based on the relationship between the target route and current route. Using a very similar snippet to the one just before:

```html
<!-- use a dynamic transition name -->
<router-view v-slot="{ Component, route }">
  <transition :name="route.meta.transition">
    <component :is="Component" />
  </transition>
</router-view>
```

We can add an [after navigation hook](./navigation-guards.md#global-after-hooks) to dynamically add information to the `meta` field based on the depth of the route

```js
router.afterEach((to, from) => {
  const toDepth = to.path.split('/').length
  const fromDepth = from.path.split('/').length
  to.meta.transition = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

## Forcing a transition between reused views

Vue might automatically reuse components that look alike, avoiding any transition. Fortunately, it is possible [to add a `key` attribute](https://v3.vuejs.org/api/special-attributes.html#key) to force transitions. This also allows you to trigger transitions while staying on the same route with different params:

```vue
<router-view v-slot="{ Component, route }">
  <transition name="fade">
    <component :is="Component" :key="route.path" />
  </transition>
</router-view>
```

<!-- TODO: interactive example -->
<!-- See full example [here](https://github.com/vuejs/vue-router/blob/dev/examples/transitions/app.js). -->
