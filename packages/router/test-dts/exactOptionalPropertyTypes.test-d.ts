import { describe, it, expectTypeOf } from 'vitest'
import type {
  EXPERIMENTAL_RouteRecord_Base,
  EXPERIMENTAL_RouteRecord_Group,
} from 'vue-router/experimental'

describe('exactOptionalPropertyTypes', () => {
  it('a group record is a route record', () => {
    expectTypeOf<EXPERIMENTAL_RouteRecord_Group>().toMatchTypeOf<EXPERIMENTAL_RouteRecord_Base>()
  })
})
