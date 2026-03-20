<script lang="ts" setup>
import { useRoute } from 'vue-router'

definePage({
  params: {
    query: {
      mm: {
        parser: 'month-zod',
        default: 0,
      },
    },
  },
})

const route = useRoute()
</script>

<template>
  <h1>Month (zod): {{ route.params.month }}</h1>
  <pre>typeof: {{ typeof route.params.month }}</pre>
  <pre>{{ route.params }}</pre>
</template>
