<template>
  <div>
    <p>try to leave</p>
    <p>So far, you tried {{ tries }}</p>
  </div>
</template>

<script>
// @ts-check
import { defineComponent } from 'vue'
import { onBeforeRouteLeave } from '../../src'

export default defineComponent({
  name: 'GuardedWithLeave',
  data: () => ({ tries: 0 }),

  setup() {
    console.log('setup in cant leave')
    onBeforeRouteLeave(function(to, from, next) {
      if (window.confirm()) next()
      else {
        // @ts-ignore
        this.tries++
        next(false)
      }
    })
    return {}
  },
})
</script>
