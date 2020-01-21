<template>
  <div>
    <p>Here is the data: {{ data }}</p>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ComponentWithData',
  data: () => ({ data: 'nope' }),
  beforeRouteEnter(to, from, next) {
    // console.log('this in beforeRouteEnter', this)
    // setTimeout(() => {
    // next(vm => {
    //   // console.log('got vm', vm)
    //   vm.data = 'Hola'
    // })
    // }, 300)
  },
})
</script>
