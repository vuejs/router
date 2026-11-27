# `defineColadaLoader()`

Loaders that use [@pinia/colada](https://github.com/posva/pinia-colada) under the hood. These loaders provide the most efficient solution to asynchronous state with cache, ssr support and more.

A Pinia Colada loader is a `useQuery()` bound to the route: you give it a function that receives the route and returns [query options](https://pinia-colada.esm.dev/guide/queries.html). The key is directly passed to `useQuery()` from `@pinia/colada` and can be invalidated with `useMutation()` hooks. See [Pinia Colada documentation about query invalidation](https://pinia-colada.esm.dev/guide/query-invalidation.html) to learn more.

## Setup

Follow the installation instructions in [@pinia/colada](https://github.com/posva/pinia-colada).

## Example

<!--
TODO: example with twoslash when it works
// ---cut-start---
import './typed-router.d'
// ---cut-end---
// @moduleResolution: bundler
 -->

```vue
<script lang="ts">
import { defineColadaLoader } from 'vue-router/experimental/pinia-colada'
import { getUserById } from '../api'

export const useUserData = defineColadaLoader('/users/[id]', to => ({
  key: ['users', to.params.id],
  query: ({ signal }) => getUserById(to.params.id, { signal }),
  // Keep the data "fresh" 10 seconds to avoid fetching the same data too often
  staleTime: 10000,
}))
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

const {
  user,
  status,
  error
  isLoading,
  reload,
  refresh,
} = useUserData()
</script>

<template>
  <main>
    <h1>Pinia Colada Loader Example</h1>
    <pre>User: {{ route.params.id }}</pre>

    <fieldset>
      <legend>Controls</legend>

      <button @click="refresh()">Refresh</button>
      <button @click="reload()">Refetch</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 - 1 } }">
      Previous
    </RouterLink>
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 + 1 } }">
      Next
    </RouterLink>

    <h2>State</h2>

    <p>
      <code>status: {{ status }}</code>
      <br />
      <code>isLoading: {{ isLoading }}</code>
    </p>
    <pre v-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user == null ? String(user) : user }}</pre>
  </main>
</template>
```

<!-- TODO: add autocompletion to show all pinia colada options -->

::: tip
The route name is optional. It gives a typed `to` parameter.
:::

## Reusing query options

Because the loader returns query options, you can reuse the ones defined with [`defineQueryOptions()`](https://pinia-colada.esm.dev/guide/reusable-queries.html):

```ts
import { defineQueryOptions } from '@pinia/colada'
import { defineColadaLoader } from 'vue-router/experimental/pinia-colada'

const userQuery = defineQueryOptions((id: string) => ({
  key: ['users', id],
  query: () => getUserById(id),
}))

export const useUserData = defineColadaLoader('/users/[id]', to =>
  userQuery(to.params.id)
)
```

## Loader options

Data loader options like `lazy`, `server` or `errors` go in the last argument. They are not query options:

```ts
export const useUserData = defineColadaLoader(
  '/users/[id]',
  to => userQuery(to.params.id),
  { lazy: true }
)
```

## Abort signals

The `query` function receives the `signal` of Pinia Colada. Like with `useQuery()`, Pinia Colada aborts it when no component uses the query anymore, e.g. when a cancelled navigation makes the page show the previous query again.

The function that returns the query options receives the navigation context as its second argument. Its `signal` is aborted when the navigation is cancelled. Use it only if the request must stop with the navigation:

```ts
export const useUserData = defineColadaLoader(
  '/users/[id]',
  (to, navigation) => ({
    key: ['users', to.params.id],
    query: () => getUserById(to.params.id, { signal: navigation.signal }),
  })
)
```

::: warning
The function that returns the query options can run more than once for the same route. Do not cause side effects in it.
:::

## Refresh by default

To avoid unnecessary frequent refreshes, Pinia Colada refreshes the data when navigating (instead of _refetching_). Change the `staleTime` option to control how often the data should be fetched, e.g. setting it to 0 will fetch the data every time the route changes.

## Route tracking

The loader tracks what is used in the `to` parameter, in the function that returns the query options and in the `query` function. It only refreshes the data if **tracked** properties change. This means that if you use `to.params.id`, it will only refetch the data if the `id` parameter changes but not if other properties like `to.query`, `to.hash` or even `to.params.other` change. To make sure the data is updated, it will still refresh in these scenarios. Configure the `staleTime` option to control how often the data should be refreshed.

## SSR

Follow Pinia Colada docs for SSR.

## Nuxt

Use `@pinia/colada-nuxt` plugin and SSR will work out of the box. Hydration won't trigger an extra fetch!
