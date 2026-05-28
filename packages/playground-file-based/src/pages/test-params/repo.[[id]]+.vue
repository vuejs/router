<script setup lang="ts">
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      id: 'test-num',
    },
  },
})

const route = useRoute()
// route.params.id should be `number[]` (possibly empty)
</script>

<template>
  <h1>Optional repeatable path param (0+)</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.id) }}</pre>
  <pre>{{ route.params }}</pre>
</template>
