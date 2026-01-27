# Defining Data Loaders

In order to use data loaders, you need to define them first. Data loaders themselves are the composables returned by the different `defineLoader` functions. Each loader definition is specific to the `defineLoader` function used. For example, `defineBasicLoader` expects an async function as the first argument while `defineColadaLoader` expects an object with a `query` function. All loaders should allow to pass an async function that can throw errors, and `NavigationResult`.

Any composables returned by _any_ `defineLoader` function share the same signature:

```vue twoslash
<script lang="ts">
import 'vue-router/auto-routes'
// ---cut---
import { defineBasicLoader } from 'vue-router/experimental'
import { getUserById } from '../api'

export const useUserData = defineBasicLoader('/users/[id]', async to => {
  return getUserById(to.params.id)
})
</script>

<script setup lang="ts">
const {
  data: user, // the data returned by the loader
  isLoading, // a boolean indicating if the loader is fetching data
  error, // an error object if the loader failed
  reload, // a function to refetch the data without navigating
} = useUserData()
</script>
```

**But they are not limited by it!** For example, the `defineColadaLoader` function returns a composable with a few more properties like `status` and `refresh`. Because of this it's important to refer to the documentation of the specific loader you are using.

This page will guide you through the **foundation** of defining data loaders, no matter their implementation.

## The loader function

The loader function is the _core_ of data loaders. They are asynchronous functions that return the data you want to expose in the `data` property of the returned composable.

### The `to` argument

The `to` argument represents the location object we are navigating to. It should be used as the source of truth for all data fetching parameters.

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader } from 'vue-router/experimental'
import { getUserById } from '../api'
// ---cut---
export const useUserData = defineBasicLoader('/users/[id]', async to => {
  const user = await getUserById(to.params.id)
  // here we can modify the data before returning it
  return user
})
```

By using the route location to fetch data, we ensure a consistent relationship between the data and the URL, **improving the user experience**.

### Side effects

It's important to avoid side effects in the loader function. Don't call `watch`, or create reactive effects like `ref`, `toRefs()`, `computed`, etc.

### Global Properties

In the loader function, you can access global properties like the router instance, a store, etc. This is because using `inject()` within the loader function **is possible**, just like within navigation guards. Since loaders are asynchronous, make sure you are using the `inject` function **before any `await`**:

```ts twoslash
import 'vue-router/auto-routes'
import { defineBasicLoader } from 'vue-router/experimental'
import { getUserById } from '../api'
// ---cut---
import { inject } from 'vue'
import { useSomeStore, useOtherStore } from '@/stores'

export const useUserData = defineBasicLoader('/users/[id]', async to => {
  // ✅ This will work
  const injectedValue = inject('key') // [!code ++]
  const store = useSomeStore() // [!code ++]

  const user = await getUserById(to.params.id)
  // ❌ These won't work
  const injectedValue2 = inject('key-2') // [!code error]
  const store2 = useOtherStore() // [!code error]
  // ...
  return user
})
```

<!--
Why doesn't this work?
  // @error: Custom error message
-->

### Navigation control

Since loaders happen within the context of a navigation, you can control the navigation by returning a `NavigationResult` object. This is similar to returning a value in a navigation guard

```ts{1,8,9}
import { NavigationResult } from 'vue-router/experimental'

const useDashboardStats = defineBasicLoader('/admin', async (to) => {
  try {
    return await getDashboardStats()
  } catch (err) {
    if (err.code === 401) {
      // same as returning '/login' in a navigation guard
      return new NavigationResult('/login')
    }
    throw err // unexpected error
  }
})
```

::: tip

Note that [lazy loaders](#lazy-loaders) cannot control the navigation since they do not block it.

:::

Read more in the [Navigation Aware](./navigation-aware.md) section.

### Errors

Any thrown Error will abort the navigation, just like in navigation guards. They will trigger the `router.onError` handler if defined.

::: tip

Note that [lazy loaders](#lazy-loaders) cannot control the navigation since they do not block it, any thrown error will appear in the `error` property and not abort the navigation nor appear in the `router.onError` handler.

:::

It's possible to define expected errors so they don't abort the navigation. You can read more about it in the [Error Handling](./error-handling.md) section.

## Options

Data loaders are designed to be flexible and allow for customization. Despite being navigation-centric, they can be used outside of a navigation and this flexibility is key to their design.

### Non blocking loaders with `lazy`

By default, loaders are _non-lazy_, meaning they will block the navigation until the data is fetched. But this behavior can be changed by setting the `lazy` option to `true`.

```vue{10,16} twoslash
<script lang="ts">
// ---cut-start---
import 'vue-router/auto-routes'
import { defineBasicLoader } from 'vue-router/experimental'
// ---cut-end---
import { getUserById } from '../api'

export const useUserData = defineBasicLoader(
  '/users/[id]',
  async (to) => {
    const user = await getUserById(to.params.id)
    return user
  },
  { lazy: true } // 👈  marked as lazy
)
</script>

<script setup>
// Differently from the example above, `user.value` can and will be initially `undefined`
const { data: user, isLoading, error } = useUserData()
//            ^?
</script>

<!-- ... -->
```

This patterns is useful to avoid blocking the navigation while _non critical data_ is being fetched. It will display the page earlier while lazy loaders are still loading and you are able to display loader indicators thanks to the `isLoading` property.

Since lazy loaders do not block the navigation, any thrown error will not abort the navigation nor appear in the `router.onError` handler. Instead, the error will be available in the `error` property.

Note this still allows for having different behavior during SSR and client side navigation, e.g.: if we want to wait for the loader during SSR but not during client side navigation:

```ts{6-7}
export const useUserData = defineBasicLoader(
  async (to) => {
    // ...
  },
  {
    lazy: !import.meta.env.SSR, // Vite specific
  }
)
```

You can even pass a function to `lazy` to determine if the loader should be lazy or not based on each load/navigation:

```ts{6-7}
export const useSearchResults = defineBasicLoader(
  async (to) => {
    // ...
  },
  {
    // lazy if we are on staying on the same route
    lazy: (to, from) => to.name === from.name,
  }
)
```

This is really useful when you can display the old data while fetching the new one and some of the parts of the page require the route to be updated like search results and pagination buttons. By using a lazy loader only when the route changes, the pagination can be updated immediately while the search results are being fetched, allowing the user to click multiple times on the pagination buttons without waiting for the search results to be fetched.

### Delaying data updates with `commit`

By default, the data is updated only once all loaders are resolved. This is useful to avoid displaying partially loaded data or worse, incoherent data aggregation.

Sometimes you might want to immediately update the data as soon as it's available, even if other loaders are still pending. This can be achieved by changing the `commit` option:

```ts twoslash
import { defineBasicLoader } from 'vue-router/experimental'
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchBookCollection(): Promise<Book[]> {
  return {} as any
}
// ---cut---
export const useBookCollection = defineBasicLoader(fetchBookCollection, {
  commit: 'immediate',
})
```

In the case of [lazy loaders](#lazy-loaders), they also default to `commit: 'after-load'`. They will commit after all other non-lazy loaders if they can but since they are not awaited, they might not be able to. In this case, the data will be available when finished loading, which can be much later than the navigation is completed.

### Server optimization with `server`

During SSR, it might be more performant to avoid loading data that isn't critical for the initial render. This can be achieved by setting the `server` option to `false`. That will completely skip the loader during SSR.

```ts{3} twoslash
import { defineBasicLoader } from 'vue-router/experimental'
interface Book {
  title: string
  isbn: string
  description: string
}
function fetchRelatedBooks(id: string | string[]): Promise<Book[]> {
  return {} as any
}
// ---cut---
export const useRelatedBooks = defineBasicLoader(
  (to) => fetchRelatedBooks(to.params.id),
  { server: false }
)
```

You can read more about server side rendering in the [SSR](./ssr.md) section.

## Connecting a loader to a page

The router needs to know what loaders should be ran with which page. This is achieved in two ways:

- **Automatically**: when a loader is exported from a page component that is lazy loaded, the loader will be automatically connected to the page

  ::: code-group

  ```ts{8} [router.ts]
  import { createRouter, createWebHistory } from 'vue-router'

  export const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/settings',
        component: () => import('./settings.vue'),
      },
    ],
  })
  ```

  ```vue{3-5} [settings.vue]
  <script lang="ts">
  import { getSettings } from './api'
  export const useSettings = defineBasicLoader('/settings', async (to) =>
    getSettings()
  )
  </script>

  <script lang="ts" setup>
  const { data: settings } = useSettings()
  </script>
  <!-- ...rest of the component -->
  ```

  :::

- **Manually**: by passing the defined loader into the `meta.loaders` property:

  ::: code-group

  ```ts{2,10-12} [router.ts]
  import { createRouter, createWebHistory } from 'vue-router'
  import Settings, { useSettings } from './settings.vue'

  export const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/settings',
        component: Settings,
        meta: {
          loaders: [useSettings],
        },
      }
    ],
  })
  ```

  ```vue{3-5} [settings.vue]
  <script lang="ts">
  import { getSettings } from './api'
  export const useSettings = defineBasicLoader('/settings', async (to) =>
    getSettings()
  )
  </script>

  <script lang="ts" setup>
  const { data: settings } = useSettings()
  </script>
  <!-- ...rest of the component -->
  ```

### _Disconnecting_ a loader from a page

It is also possible **not to connect a loader to a page**. This allows you to delay the loading until the component is mounted. Usually you want to start loading the data as soon as possible but in some cases, it might be better to wait until the component is mounted. This can be achieved by not exporting the loader from the page component.
