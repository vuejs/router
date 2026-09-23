import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouterOptions,
} from 'vue-router/experimental'
import { useScrollRestoration } from 'vue-router/experimental'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

declare module 'vue-router' {
  interface TypesConfig {
    Router: EXPERIMENTAL_Router
  }
}

describe('Router conditional via TypesConfig', () => {
  const router = useRouter()
  it('resolves to EXPERIMENTAL_Router when augmented', () => {
    expectTypeOf(router).toEqualTypeOf<EXPERIMENTAL_Router>()
  })

  it('options shape follows the augmented Router', () => {
    expectTypeOf(router.options).toEqualTypeOf<EXPERIMENTAL_RouterOptions>()
  })
})

describe('useScrollRestoration', () => {
  it('accepts reactive manual options', () => {
    useScrollRestoration({ manual: ref(true) })
    useScrollRestoration({ manual: () => true })
  })
})
