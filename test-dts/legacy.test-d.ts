import { Router, RouteLocationNormalizedLoaded, expectType } from './index'
import { defineComponent } from 'vue'

defineComponent({
  methods: {
    doStuff() {
      expectType<Router>(this.$router)
      expectType<RouteLocationNormalizedLoaded>(this.$route)
    },
  },
})
