<template>
  <div>Not Found: {{ route.fullPath }}</div>
</template>

<script>
import { defineComponent } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'NotFound',
  setup() {
    const route = useRoute()
    return { route }
  },
})
</script>
