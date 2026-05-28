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
// route.params.ids should be `string[]` (1+ segments, each segment also csv-split)
</script>

<template>
  <h1>Raw csv: repeatable path param (1+)</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.ids) }}</pre>
  <pre>{{ route.params }}</pre>
  <p>
    Try
    <RouterLink to="/test-params/raw/rep/a,b/c,d">/raw/rep/a,b/c,d</RouterLink>
  </p>
</template>
