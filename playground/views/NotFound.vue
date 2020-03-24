<template>
  <div>Not Found: {{ route.fullPath }}</div>
</template>

<script>
import { defineComponent, inject } from 'vue'
import { useRoute } from '../../src'

export default defineComponent({
  name: 'NotFound',
  setup() {
    const route = useRoute()
    return { route }
  },
})
</script>
