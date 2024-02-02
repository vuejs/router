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
If you want the transition to run on the first render, add `appear` as attribute to the transition tag.

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

```js
import { useRoute } from 'vue-router'
const route = useRoute()
```
The `router-view` needs the route's full path as key. Although the route can be destructured from the slot props, that destructured route cannot be used in the key attribute. That's why getting the route from `useRoute` is the clean code solution. Setting a `key` on the inner `component` tag may cause application crashes in certain situations. See discussion in [issue 2121](https://github.com/vuejs/router/issues/2121) for more information about that.

```vue-html
<router-view v-slot="{ Component }" :key="route.fullPath">
  <transition name="fade">
    <component :is="Component" />
  </transition>
</router-view>
```

See full example at Stackblitz: [Vue Router Transitions Demo](https://stackblitz.com/edit/vue-router-transitions-demo).
