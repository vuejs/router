<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      |
      <RouterLink to="/about">About</RouterLink>
    </nav>
  </header>

  <p>
    fullPath: <code>{{ route.fullPath }}</code>
    <br />
    path: <code>{{ route.path }}</code>
    <br />
    query: <code>{{ route.query }}</code>
    <br />
    hash: <code>{{ route.hash }}</code>
    <br />
    params: <code>{{ route.params }}</code>
    <br />
    meta: <code>{{ route.meta }}</code>
  </p>

  <RouterView />
</template>
