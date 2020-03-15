<template>
  <div>User: {{ id }}</div>
</template>

<script>
import { defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'User',
  props: {
    id: String,
  },
})
</script>
