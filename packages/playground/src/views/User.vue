<template>
  <div>User: {{ id }}</div>
</template>

<script setup lang="ts">
import { onBeforeRouteUpdate } from 'vue-router'

defineProps<{ id: string }>()

onBeforeRouteUpdate(() => {
  console.log('in beforeRouteUpdate this', this)
})
</script>
