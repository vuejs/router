<script setup lang="ts">
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      ids: 'test-set',
    },
  },
})

const route = useRoute()
// route.params.ids should be `Set<string>` (possibly empty)
</script>

<template>
  <h1>Raw set: optional path param</h1>
  <pre>is Set: {{ route.params.ids instanceof Set }}</pre>
  <pre>size: {{ route.params.ids?.size }}</pre>
  <pre>{{ [...(route.params.ids ?? [])] }}</pre>
</template>
