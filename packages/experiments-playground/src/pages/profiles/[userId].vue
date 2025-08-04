<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <main>
    <h2>Details</h2>
    <p>{{ route.fullPath }}</p>
    <pre>{{ route.params }}</pre>
  </main>
</template>
