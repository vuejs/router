<template>
  <div>
    <p>Here is the data: {{ fromApi }}</p>
    other {{ other }}
  </div>
</template>

<script>
import { defineComponent, toRefs, reactive } from 'vue'
import { getData, delay } from '../api'
import { onBeforeRouteUpdate } from 'vue-router'

export default defineComponent({
  name: 'ComponentWithData',
  async setup() {
    const data = reactive({ other: 'old', fromApi: null })

    onBeforeRouteUpdate(async (to, from, next) => {
      data.fromApi = await getData()
      next()
    })

    data.fromApi = await getData()

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
