<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const url = ref('')
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      |
      <RouterLink to="/about">About</RouterLink>
      |
      <RouterLink to="/nested">Nested</RouterLink>
    </nav>
    <form @submit.prevent="router.push(url)">
      <label for="path">Path:</label>
      <input
        id="path"
        type="text"
        v-model="url"
        placeholder="/go/somewhere?nice"
      />
      <button type="submit">Go</button>
    </form>
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
