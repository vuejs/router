<template>
  <div>
    <p>try to leave</p>
    <p>So far, you tried {{ tries }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const tries = ref(0)

console.log('setup in cant leave')
onBeforeRouteLeave((to, from, next) => {
  if (window.confirm('Do you really want to leave?')) next()
  else {
    tries.value++
    next(false)
  }
})
</script>
