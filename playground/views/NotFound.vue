<template>
  <div>Not Found: {{ route.fullPath }}</div>
</template>

<script>
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'NotFound',
  setup() {
    const route = inject('route')
    return { route }
  },
})
</script>
