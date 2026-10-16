# Displaying a different route

<!-- <RuleKitLink /> -->

By default, `<RouterView>` displays the current route. Pass a `route` prop to display another route location instead, while the URL stays the same:

```vue-html
<RouterView :route="someOtherRoute" />
```

The value must be a resolved route location, e.g. the result of `router.resolve()`. If the route components are lazy loaded, load them first with `loadRouteLocation()`. When the `route` prop is `undefined`, `<RouterView>` displays the current route.

## Modals with their own URL

The most common use case is a modal that has its own URL, while the page that opened it stays visible in the background. For example, opening the details of a user in a modal goes to `/users/1`, but the home page is still displayed behind it.

Save the location of the background page in the history state when opening the modal:

```ts
router.push({
  name: 'user',
  params: { id },
  state: { backgroundView: router.currentRoute.value.fullPath },
})
```

Then, render the background page with the `route` prop, and render the modal **next to it** with a second `<RouterView>` that displays the current route:

```vue
<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const historyState = shallowRef(history.state)
router.afterEach(() => {
  historyState.value = history.state
})

const backgroundRoute = computed(() =>
  historyState.value?.backgroundView
    ? router.resolve(historyState.value.backgroundView)
    : undefined
)
</script>

<template>
  <RouterView :route="backgroundRoute" />

  <dialog v-if="backgroundRoute" open>
    <RouterView />
    <button @click="router.back()">Close</button>
  </dialog>
</template>
```

The same route component is displayed in the modal when the user opens it from a page, and as a full page when the user visits `/users/1` directly or reloads the page. If the background page uses lazy loaded components, load them before the navigation ends:

```ts
router.beforeResolve(async () => {
  const { backgroundView } = history.state ?? {}
  if (backgroundView) {
    await loadRouteLocation(router.resolve(backgroundView))
  }
})
```

## Reading the route inside the view

Nested `<RouterView>`s, `useRoute()`, and the active classes of `<RouterLink>` inside a `<RouterView>` with a `route` prop use that route. This way, the background page and its children behave as if the user was still on that page: their params, query, and watchers do not change when the modal opens.

Some values still use the current route (the URL):

- `$route`, which is the same as `useRouter().currentRoute.value`.
- Relative locations like `{ query: { tab: 'posts' } }` in `router.push()` and `<RouterLink>`. They are resolved against the current route, not the displayed one.

If a component needs the current route, place it outside of the `<RouterView>` that receives the `route` prop, like the modal above, or read `useRouter().currentRoute`.

::: warning
In v5.4 and earlier, `useRoute()` and `<RouterLink>` ignored the `route` prop and always used the current route. If a component inside the view relies on that, e.g. a modal placed _inside_ the background page that reads the params of the modal route, move it next to the `<RouterView>`, as shown above.
:::
