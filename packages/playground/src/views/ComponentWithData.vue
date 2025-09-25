<template>
  <div>
    <p>Here is the data: {{ fromApi }}</p>
    other {{ other }}
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs, reactive } from 'vue'
import { getData, delay } from '../api'
import { onBeforeRouteUpdate } from 'vue-router'

const ComponentWithData = defineComponent({
  name: 'ComponentWithData',
  async setup() {
    const data = reactive<{ other: string, fromApi: null | {message: string, time: number }}>({ other: 'old', fromApi: null })

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
      console.log('got vm', vm);
      // Workaround for https://github.com/vuejs/router/issues/701
      (vm as InstanceType<typeof ComponentWithData>).other = 'Hola'
    })
  },
})

export default ComponentWithData
</script>
