<template>
  <div>
    <div>Home</div>
    <p>My Data is: {{ someData }}</p>
    <p v-if="waited != null">I waited for {{ waited }}</p>
    toggle: {{ log(toggle) }}
    <button @click="counter++">{{ counter }}</button>
  </div>
</template>

<script>
import { defineComponent, getCurrentInstance, ref } from 'vue'

export default defineComponent({
  name: 'Home',
  props: ['waited'],
  data: () => ({
    toggle: false,
    counter: 0,
  }),

  setup() {
    const me = getCurrentInstance()

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
