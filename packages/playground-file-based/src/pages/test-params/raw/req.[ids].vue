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
// route.params.ids should be `string[]`
</script>

<template>
  <h1>Raw csv: required path param</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.ids) }}</pre>
  <pre>{{ route.params }}</pre>
  <p>
    Try: <RouterLink to="/test-params/raw/req/a,b,c">/raw/req/a,b,c</RouterLink>
  </p>
</template>
