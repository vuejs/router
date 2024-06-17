import { expectTypeOf } from 'vitest'
import { Router, RouteLocationNormalizedLoaded } from './index'
import { defineComponent } from 'vue'

defineComponent({
  methods: {
    doStuff() {
      expectTypeOf<Router>(this.$router)
      expectTypeOf<RouteLocationNormalizedLoaded>(this.$route)
    },
  },
})
