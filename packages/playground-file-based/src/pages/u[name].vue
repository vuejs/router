<script lang="ts" setup>
import { useRoute } from 'vue-router'

definePage({
  params: {
    path: {
      name: 'date',
    },
  },
})

const route = useRoute()
route.params.name
</script>

<template>
  <h1>Named param</h1>
  <pre>{{ $route.params }}</pre>

  <RouterView />
</template>
