<template>
  <div>
    <p>try to leave</p>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuardedWithLeave',
  beforeRouteLeave(to, from, next) {
    if (window.confirm()) next()
    else next(false)
  },
})
</script>
