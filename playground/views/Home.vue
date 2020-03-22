<template>
  <div>
    <div>Home</div>
    <p>My Data is: {{ someData }}</p>
    toggle: {{ log(toggle) }}
    <button @click="counter++">{{ counter }}</button>
  </div>
</template>

<script>
import { defineComponent, getCurrentInstance, inject, ref } from 'vue'
// import { guardSymbol } from '../../src/components/View'

export default defineComponent({
  name: 'Home',
  data: () => ({
    toggle: false,
    counter: 0,
  }),

  setup() {
    const me = getCurrentInstance()
    // const registerGuard = inject(guardSymbol)
    // console.log('calling setup in Home')
    // await registerGuard(me)
    // emit('registerGuard', getCurrentInstance())

    function log(value) {
      console.log(value)
      return value
    }

    return {
      log,
      someData: ref(0),
    }
  },

  _beforeRouteEnter() {
    this.toggle = true
  },
})
</script>
