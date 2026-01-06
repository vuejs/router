<template>
  <div>Not Found: {{ route.fullPath }}</div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
