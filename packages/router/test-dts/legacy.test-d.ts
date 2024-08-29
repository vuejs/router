import { describe, expectTypeOf, it } from 'vitest'
import {
  useRouter,
  useRoute,
  // rename types for better error messages, otherwise they have the same name
  // RouteLocationNormalizedLoadedTyped as I_RLNLT
} from './index'
import { defineComponent } from 'vue'

describe('Instance types', () => {
  it('creates a $route instance property', () => {
    defineComponent({
      methods: {
        doStuff() {
          // TODO: can't do a proper check because of typed routes
          expectTypeOf(this.$route.params).toMatchTypeOf(useRoute().params)
        },
      },
    })
  })

  it('creates $router instance properties', () => {
    defineComponent({
      methods: {
        doStuff() {
          // TODO: can't do a proper check because of typed routes
          expectTypeOf(this.$router.back).toEqualTypeOf(useRouter().back)
        },
      },
    })
  })
})
