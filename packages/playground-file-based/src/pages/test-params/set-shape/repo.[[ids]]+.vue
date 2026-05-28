<script setup lang="ts">
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      ids: 'test-set-shape',
    },
  },
})

const route = useRoute()
// route.params.ids should be `Set<string>` (0+ segments, possibly empty)
</script>

<template>
  <h1>Raw set-shape: optional repeatable path param (0+)</h1>
  <pre>is Set: {{ route.params.ids instanceof Set }}</pre>
  <pre>size: {{ route.params.ids?.size }}</pre>
  <pre>{{ [...(route.params.ids ?? [])] }}</pre>
</template>
