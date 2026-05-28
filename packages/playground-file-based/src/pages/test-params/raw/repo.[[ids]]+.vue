<script setup lang="ts">
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      ids: 'test-csv',
    },
  },
})

const route = useRoute()
// route.params.ids should be `string[]` (0+ segments, each segment also csv-split)
</script>

<template>
  <h1>Raw csv: optional repeatable path param (0+)</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.ids) }}</pre>
  <pre>{{ route.params }}</pre>
  <p>
    Try
    <RouterLink to="/test-params/raw/repo">/raw/repo (none)</RouterLink>
    or
    <RouterLink to="/test-params/raw/repo/a,b/c">/raw/repo/a,b/c</RouterLink>
  </p>
</template>
