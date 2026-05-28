<script setup lang="ts">
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      c: 'test-color',
    },
  },
})

const route = useRoute()
// route.params.c should be `'red' | 'green' | 'blue'`
</script>

<template>
  <h1>Path-only parser (enum)</h1>
  <pre>{{ route.params }}</pre>
</template>
