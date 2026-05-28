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
// route.params.id should be `number`
</script>

<template>
  <h1>Required path param</h1>
  <pre>typeof id: {{ typeof route.params.id }}</pre>
  <pre>{{ route.params }}</pre>
</template>
