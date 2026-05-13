# Dynamic Route Matching with Params

<VueSchoolLink
  href="https://vueschool.io/lessons/dynamic-routes"
  title="Learn about dynamic route matching with params"
/>

Very often we will need to map routes with the given pattern to the same component. For example, we may have a `User` component which should be rendered for all users but with different user IDs. In Vue Router we can use a dynamic segment in the path to achieve that, we call that a _param_:

```js
import User from './User.vue'

// these are passed to `createRouter`
const routes = [
  // dynamic segments start with a colon
  { path: '/users/:id', component: User },
]
```

Now URLs like `/users/johnny` and `/users/jolyne` will both map to the same route.

A _param_ is denoted by a colon `:`. When a route is matched, the value of its _params_ will be exposed as `route.params` in every component. Therefore, we can render the current user ID by updating `User`'s template to this:

```vue
<template>
  <div>
    <!-- The current route is accessible as $route in the template -->
    User {{ $route.params.id }}
  </div>
</template>
```

You can have multiple _params_ in the same route, and they will map to corresponding fields on `route.params`. Examples:

| pattern                        | matched path             | route.params                             |
| ------------------------------ | ------------------------ | ---------------------------------------- |
| /users/:username               | /users/eduardo           | `{ username: 'eduardo' }`                |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

- [See it in the Playground](https://play.vuejs.org/#eNqdVOtu0zAUfhUrIDWVlrgdF6GQVYNpEkMCpgG/CD+yxm29ObZlO22nqu/O8SWX0W5IVErjnOt3zvmOd1FdUp7e6SiLaC2FMmiH5oqUhnyQEu3RQokajdYNGRW8M1CiMUR12hR7QW9ifVtdKWXq/Qvu7VLZ6FU8wo0mSmNSNaWqBJZCG42no3FqVoTH8RidzdCu4KjHE8MzthKEUnCOfbhWUouGm3j0AhKOQLaHJzqJQnqoLzeklgwizaxDvprObqw/kqUqa51jEDiFdC84aKMEX84uGqUIN75qsDarLMdBh3Y79NIp0kXD2DUo0X7vwmAfJ+flug3YsHCCM6PdGb58JQmj/B4ZcVZEx5tTRLPjijyMwEXok+BBlv/KeDp5KuXp5J85cxwKznHbhNzSrVUH9zUlG4SDYdDneDAs+NTmgRGk50KSCiTpIHNCtuXcJPDQNQmEEUyoDHhDay34e+CCjehigDOQIvDwGO2/kFqoh09UG3idBKEjSk944FPSUb4j/U/o0jX0pmN+K+joT7bOcC44WIUlOnuUInb4Vz67reAAUjw+sSbOW2fol++lc7M/R0/U7lZmX7ysSRhaZl9X1ciFsL+5AOwc2J118INu796/4T8s0rCaw22qaMtyazdYC79ddl0dENgOtKGwJRbJoZnH162QjzogA+Dw3U7qUsL8BAcorvgiKHQRZW07iqiflBUX0coYqTOMGy7vlylUj3uL8zfpJH0LObUZSFOi6+RWiQ0UAAmLKPSniM7BCFdkbYRgOiklfSrFgeH5u3SaTvtMQ91BPpsO2rGH0g0sAF/Q5V+F2yFSRtQ3aShQ61EDSsbE5rOTGdWQDvx8Reb3R+R3euvLuFYEEKzJoGBTqiUxXn35/SvZwrlT1qJqGFg/o7whWrDGYvRmHxteAeyBnUN75eZI+fKHvtwawnVblAXquuHs3XAvnim9h/sqfT3oorsHdDrXdvvhYjpB9tLxfrdCVQSujlO5RQCWVujFZDKBGwSBkVpSntwKY0SdoakitZPLsqoAbCeBLAWHsKhhPiaMGcgL27xgZOtcGAw+cTAyxGH9HscZpvNfXUhGMy5MnLESAohFYh4kGfssAZ6iyxUsc48l2v8BszmoiA==)

In addition to `route.params`, the `route` object also exposes other useful information such as `route.query` (if there is a query in the URL), `route.hash`, etc. You can check out the full details in the [API Reference](../../api/#RouteLocationNormalized).

## Reacting to Params Changes

<VueSchoolLink
  href="https://vueschool.io/lessons/reacting-to-param-changes"
  title="Learn how to react to param changes"
/>

One thing to note when using routes with params is that when the user navigates from `/users/johnny` to `/users/jolyne`, **the same component instance will be reused**. Since both routes render the same component, this is more efficient than destroying the old instance and then creating a new one. **However, this also means that some lifecycle hooks of the component will not be called**.

To react to params changes in the same component, you can simply watch anything on the `route` object, in this scenario, the `route.params`:

::: code-group

```vue [Composition API]
<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

watch(
  () => route.params.id,
  (newId, oldId) => {
    // react to route changes...
  }
)
</script>
```

```vue [Options API]
<script>
export default {
  created() {
    this.$watch(
      () => this.$route.params.id,
      (newId, oldId) => {
        // react to route changes...
      }
    )
  },
}
</script>
```

:::

Or, use the `beforeRouteUpdate` [navigation guard](../advanced/navigation-guards.md), which also allows you to cancel the navigation:

::: code-group

```vue [Composition API]
<script setup>
import { onBeforeRouteUpdate } from 'vue-router'
// ...

onBeforeRouteUpdate(async (to, from) => {
  // react to route changes...
  userData.value = await fetchUser(to.params.id)
})
</script>
```

```vue [Options API]
<script>
export default {
  async beforeRouteUpdate(to, from) {
    // react to route changes...
    this.userData = await fetchUser(to.params.id)
  },
  // ...
}
</script>
```

:::

## Catch all / 404 Not found Route

<VueSchoolLink
  href="https://vueschool.io/lessons/404-not-found-page"
  title="Learn how to make a catch all/404 not found route"
/>

Regular params will only match characters in between url fragments, separated by `/`. If we want to match **anything**, we can use a custom _param_ regexp by adding the regexp inside parentheses right after the _param_:

```js
const routes = [
  // will match everything and put it under `route.params.pathMatch`
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFound },
  // will match anything starting with `/user-` and put it under `route.params.afterUser`
  { path: '/user-:afterUser(.*)', component: UserGeneric },
]
```

In this specific scenario, we are using a [custom regexp](./route-matching-syntax.md#custom-regexp-in-params) between parentheses and marking the `pathMatch` param as [optionally repeatable](./route-matching-syntax.md#optional-parameters). This allows us to directly navigate to the route if we need to by splitting the `path` into an array:

```js
router.push({
  name: 'NotFound',
  // preserve current path and remove the first char to avoid the target URL starting with `//`
  params: { pathMatch: route.path.substring(1).split('/') },
  // preserve existing query and hash if any
  query: route.query,
  hash: route.hash,
})
```

See more in the [repeated params](./route-matching-syntax.md#Repeatable-params) section.

If you are using [History mode](./history-mode.md), make sure to follow the instructions to correctly configure your server as well.

<RuleKitLink />

## Advanced Matching Patterns

Vue Router uses its own path matching syntax, inspired by the one used by `express`, so it supports many advanced matching patterns such as optional params, zero or more / one or more requirements, and even custom regex patterns. Please check the [Advanced Matching](./route-matching-syntax.md) documentation to explore them.
