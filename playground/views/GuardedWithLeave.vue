<template>
  <div>
    <p>try to leave</p>
    <p>So far, you tried {{ tries }}</p>
  </div>
</template>

<script>
// @ts-check
import { defineComponent, ref } from 'vue'
import { onBeforeRouteLeave } from '../../src'

export default defineComponent({
  name: 'GuardedWithLeave',
  data: () => ({}),

  setup() {
    console.log('setup in cant leave')
    const tries = ref(0)
    onBeforeRouteLeave(function (to, from, next) {
      if (window.confirm('Do you really want to leave?')) next()
      else {
        // @ts-ignore
        tries.value++
        next(false)
      }
    })
    return { tries }
  },
})
</script>
