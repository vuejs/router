import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouterOptions,
} from 'vue-router/experimental'
import { handleHotUpdate, resolver } from 'vue-router/auto-resolver'

declare const router: EXPERIMENTAL_Router

describe('vue-router/auto-resolver', () => {
  it('exports the resolver', () => {
    expectTypeOf(resolver).toEqualTypeOf<
      EXPERIMENTAL_RouterOptions['resolver']
    >()
  })

  it('handleHotUpdate accepts an optional callback with the new resolver', () => {
    handleHotUpdate(router)
    handleHotUpdate(router, newResolver => {
      expectTypeOf(newResolver).toEqualTypeOf<
        EXPERIMENTAL_RouterOptions['resolver']
      >()
    })
    // @ts-expect-error: the callback receives a resolver, not routes
    handleHotUpdate(router, (_newResolver: string) => {})
  })
})
