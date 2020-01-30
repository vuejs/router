<template>
  <div>User: {{ route.params.id }}</div>
</template>

<script>
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'User',
  setup() {
    const route = inject('route')
    console.log('calling setup in User')
    return { route }
  },
})
</script>
