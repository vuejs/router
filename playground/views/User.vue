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

  beforeRouteUpdate(to, from, next) {
    // TODO: these do not work yet
    console.log('this', this)
    next(vm => {
      console.log('in next', vm)
    })
  },
})
</script>
