<template>
  <div>
    <p>Here is the data: {{ fromApi }}</p>
    other {{ other }}
  </div>
</template>

<script>
import { defineComponent, toRefs, reactive, inject } from 'vue'
import { getData, delay } from '../api'

export default defineComponent({
  name: 'ComponentWithData',
  async setup() {
    const data = reactive({ other: 'old' })
    data.fromApi = await getData()

    // TODO: add sample with onBeforeRouteUpdate()

    return {
      ...toRefs(data),
    }
  },
  async beforeRouteEnter(to, from, next) {
    console.log('this in beforeRouteEnter', this)
    await delay(300)
    next(vm => {
      console.log('got vm', vm)
      vm.other = 'Hola'
    })
  },
})
</script>
