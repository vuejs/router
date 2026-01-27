# `defineBasicLoader()`

Basic data loader that always reruns on navigation.

::: warning
Data Loaders are experimental. Feedback is very welcome to shape the future of data loaders in Vue Router.
:::

## Setup

## Example

```vue
<script lang="ts">
import { defineBasicLoader } from 'vue-router/experimental'
import { getUserById } from '../api'

export const useUserData = defineBasicLoader(
  (to, { signal }) => {
    return getUserById(to.params.id, { signal })
  },
  {
    // used for SSR only
    key: 'user-data',
  }
)
</script>

<script lang="ts" setup>
const route = useRoute('/users/[id]')

const {
  user,
  error
  isLoading,
  reload,
} = useUserData()
</script>

<template>
  <main>
    <h1>Basic Data Loader Example</h1>
    <pre>User: {{ route.params.id }}</pre>

    <fieldset>
      <legend>Controls</legend>

      <button @click="reload()">Refetch</button>
    </fieldset>

    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 - 1 } }"
      >Previous</RouterLink
    >
    |
    <RouterLink :to="{ params: { id: Number(route.params.id) || 0 + 1 } }"
      >Next</RouterLink
    >

    <h2>State</h2>

    <p>
      <code>isLoading: {{ isLoading }}</code>
    </p>
    <pre v-if="error">Error: {{ error }}</pre>
    <pre v-else>{{ user == null ? String(user) : user }}</pre>
  </main>
</template>
```

## SSR

## Nuxt

## Unresolved Questions

- Should this basic version also track what is used in the route object, like [Svelte Data Loaders do](https://kit.svelte.dev/docs/load#rerunning-load-functions)?
