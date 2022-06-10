<template>
  <div>User: {{ id }}</div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'User',
  props: {
    id: String,
  },

  beforeRouteUpdate(to, from, next) {
    console.log('in beforeRouteUpdate this', this)
    next(vm => {
      console.log('in next callback', vm)
    })
  },
})
</script>
