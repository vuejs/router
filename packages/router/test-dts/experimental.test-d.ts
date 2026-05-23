import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouterOptions,
} from 'vue-router/experimental'
import type { Router } from 'vue-router'

declare module 'vue-router' {
  interface TypesConfig {
    Router: EXPERIMENTAL_Router
  }
}

describe('Router conditional via TypesConfig', () => {
  it('resolves to EXPERIMENTAL_Router when augmented', () => {
    expectTypeOf<Router>().toEqualTypeOf<EXPERIMENTAL_Router>()
  })

  it('options shape follows the augmented Router', () => {
    expectTypeOf<
      Router['options']
    >().toEqualTypeOf<EXPERIMENTAL_RouterOptions>()
  })
})
