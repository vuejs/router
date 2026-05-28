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
// route.params.id should be `number[]`
</script>

<template>
  <h1>Repeatable path param (1+)</h1>
  <pre>Array.isArray: {{ Array.isArray(route.params.id) }}</pre>
  <pre>{{ route.params }}</pre>
</template>
