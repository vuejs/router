# Data Loaders

Data loaders streamline any asynchronous state management with Vue Router, like **Data Fetching**. Adopting Data loaders ensures a consistent and efficient way to manage data fetching in your application. Keep all the benefits of using libraries like [Pinia Colada](./colada/) and integrate them seamlessly with client-side navigation.

This is achieved by extracting the loading logic **outside** of the component `setup` (unlike `<Suspense>`). This way, the loading logic can be executed independently of the component life cycle, and the component can focus on rendering the data. Data Loaders are automatically collected and awaited within a navigation guard, ensuring the data is ready before rendering the component.

## Features

- Parallel data fetching and deduplication
- Automatic loading state management
- Error handling
- Extensible by loader implementations
- SSR support
- Prefetching data support

## Installation

Install the `DataLoaderPlugin` **before the `router`**.

```ts{12-15} twoslash
// @errors: 2769 2345
import { createApp } from 'vue'
import { routes } from 'vue-router/auto-routes'
import { createRouter, createWebHistory } from 'vue-router'
import { DataLoaderPlugin } from 'vue-router/experimental' // [!code ++]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp({})
// Register the plugin before the router
app.use(DataLoaderPlugin, { router }) // [!code ++]
// adding the router will trigger the initial navigation
app.use(router)
app.mount('#app')
```

## Quick start

There are different data loaders implementation, the most simple one is the [Basic Loader](./basic/) which always reruns data fetching. A more efficient one, is the [Colada Loader](./colada/) which uses [@pinia/colada](https://github.com/posva/pinia-colada) under the hood. In the following examples, we will be using the _basic loader_.

Loaders are [composables](https://vuejs.org/guide/reusability/composables.html) defined through a `defineLoader` function like `defineBasicLoader` or `defineColadaLoader`. They are _used_ in the component `setup` to extract the needed information.

To get started, _define_ and _**export**_ a loader from a **page** component:

::: code-group

```vue{2,5-7,11-16} twoslash [src/pages/users/[id].vue]
<script lang="ts">
import 'vue-router/auto-routes'
// @errors: 2339
// ---cut---
import { defineBasicLoader } from 'vue-router/experimental'
import { getUserById } from '../api'

export const useUserData = defineBasicLoader('/users/[id]', async (route) => {
  return getUserById(route.params.id)
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

<template>
  <main>
    <p v-if="isLoading">Loading...</p>
    <template v-else-if="error">
      <p>{{ error.message }}</p>
      <button @click="reload()">Retry</button>
    </template>
    <template v-else>
      <p>{{ user }}</p>
    </template>
  </main>
</template>
```

:::

The loader will automatically run when the route changes, for example when navigating to `/users/1`, even when coming from `/users/2`, the loader will fetch the data and delay the navigation until the data is ready.

On top of that, you are free to _reuse_ the returned composable `useUserData` in any other component, and it will automatically share the same data fetching instance. You can even [organize your loaders in separate files](./organization.md) as long as you **export** the loader from a **page** component.

## Why Data Loaders?

Data fetching is the most common need for a web application. There are many ways of handling data fetching, and they all have their pros and cons. Data loaders are a way to streamline data fetching in your application. Instead of forcing you to choose between different libraries, data loaders provide a consistent way to manage data fetching in your application no matter the underlying library or strategy you use.
