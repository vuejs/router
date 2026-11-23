<script lang="ts" setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <h1>Optional param in the middle</h1>

  <p>{{ route.fullPath }}</p>
</template>
