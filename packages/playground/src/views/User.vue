<template>
  <div>User: {{ id }}</div>
</template>

<script setup lang="ts">
import { onBeforeRouteUpdate } from 'vue-router'

defineProps<{ id: string }>()

onBeforeRouteUpdate((to, from, next) => {
  console.log('in beforeRouteUpdate this', this)
    next(vm => {
      console.log('in next callback', vm)
    })
})
</script>
