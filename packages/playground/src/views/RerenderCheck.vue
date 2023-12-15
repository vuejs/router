<script lang="ts" setup>
import { onUpdated } from 'vue'
let count = 0
onUpdated(() => {
  console.log(`RerenderCheck.vue render: ${++count}`)
})
</script>

<template>
  <RouterView key="fixed" />
</template>
