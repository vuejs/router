<script lang="ts" setup vapor>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Blog Info</h1>

  <pre>{{ route.params }}</pre>
</template>
