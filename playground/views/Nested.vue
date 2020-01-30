<template>
  <div>
    <p>Nested level {{ level }}</p>
    <router-view v-if="level < 6"></router-view>
  </div>
</template>

<script>
import { defineComponent, inject, provide } from 'vue'
// import { guardSymbol } from '../../src/components/View'

export default defineComponent({
  name: 'Nested',
  setup() {
    const level = inject('level', 1)
    provide('level', level + 1)
    // const registerGuard = inject(guardSymbol)
    // await registerGuard()
    // console.log('done waiting')

    return {
      level,
    }
  },
})
</script>
