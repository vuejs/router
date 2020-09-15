# Transitions

In order to use transitions on your route components and animate navigations, you need to use the [v-slot API](/api/#router-view-s-v-slot):

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
  { path: '/custom-transition', meta: { transition: 'slide-left' } },
  { path: '/other-transition', meta: { transition: 'slide-right' } },
]
```

```html
<router-view v-slot="{ Component, route }">
  <!-- Use any custom transition and fallback to `fade` -->
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
  to.meta.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
})
```

<!-- TODO: interactive example -->
<!-- See full example [here](https://github.com/vuejs/vue-router/blob/dev/examples/transitions/app.js). -->
