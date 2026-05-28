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
// route.params.ids should be `string[]` (possibly empty when missing)
</script>

<template>
  <h1>Raw csv: optional path param</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.ids) }}</pre>
  <pre>{{ route.params }}</pre>
  <p>
    Try
    <RouterLink to="/test-params/raw/opt">/raw/opt (none)</RouterLink>
    or
    <RouterLink to="/test-params/raw/opt/x,y">/raw/opt/x,y</RouterLink>
  </p>
</template>
