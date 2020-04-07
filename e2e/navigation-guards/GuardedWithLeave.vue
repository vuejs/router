<template>
  <div>
    <p>try to leave</p>
    <p id="tries">So far, you tried {{ tries }} times</p>
  </div>
</template>

<script>
// @ts-check
import { defineComponent, ref } from 'vue'
import { onBeforeRouteLeave } from '../../src'

export default defineComponent({
  name: 'GuardedWithLeave',

  setup() {
    console.log('setup in cant leave')
    const tries = ref(0)

    onBeforeRouteLeave(function(to, from, next) {
      if (window.confirm()) next()
      else {
        tries.value++
        next(false)
      }
    })
    return { tries }
  },
})
</script>
