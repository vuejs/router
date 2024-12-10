import { describe, expectTypeOf, it } from 'vitest'
import { NEW_LocationResolved, RouteResolver } from './matcher'

describe('Matcher', () => {
  const matcher: RouteResolver<unknown, unknown> = {} as any

  describe('matcher.resolve()', () => {
    it('resolves absolute string locations', () => {
      expectTypeOf(
        matcher.resolve('/foo')
      ).toEqualTypeOf<NEW_LocationResolved>()
    })

    it('fails on non absolute location without a currentLocation', () => {
      // @ts-expect-error: needs currentLocation
      matcher.resolve('foo')
    })

    it('resolves relative locations', () => {
      expectTypeOf(
        matcher.resolve('foo', {} as NEW_LocationResolved)
      ).toEqualTypeOf<NEW_LocationResolved>()
    })

    it('resolved named locations', () => {
      expectTypeOf(
        matcher.resolve({ name: 'foo', params: {} })
      ).toEqualTypeOf<NEW_LocationResolved>()
    })

    it('fails on object relative location without a currentLocation', () => {
      // @ts-expect-error: needs currentLocation
      matcher.resolve({ params: { id: 1 } })
    })

    it('resolves object relative locations with a currentLocation', () => {
      expectTypeOf(
        matcher.resolve({ params: { id: 1 } }, {} as NEW_LocationResolved)
      ).toEqualTypeOf<NEW_LocationResolved>()
    })
  })

  it('does not allow a name + path', () => {
    matcher.resolve({
      // ...({} as NEW_LocationResolved),
      name: 'foo',
      params: {},
      // @ts-expect-error: name + path
      path: '/e',
    })
    // @ts-expect-error: name + currentLocation
    matcher.resolve({ name: 'a', params: {} }, {} as NEW_LocationResolved)
  })
})
