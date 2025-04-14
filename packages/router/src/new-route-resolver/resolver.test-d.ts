import { describe, expectTypeOf, it } from 'vitest'
import {
  NEW_LocationResolved,
  NEW_MatcherRecordRaw,
  NEW_RouterResolver,
} from './resolver'
import { EXPERIMENTAL_RouteRecordNormalized } from '../experimental/router'

describe('Matcher', () => {
  type TMatcherRecordRaw = NEW_MatcherRecordRaw
  type TMatcherRecord = EXPERIMENTAL_RouteRecordNormalized

  const matcher: NEW_RouterResolver<TMatcherRecordRaw, TMatcherRecord> =
    {} as any

  describe('matcher.resolve()', () => {
    it('resolves absolute string locations', () => {
      expectTypeOf(matcher.resolve({ path: '/foo' })).toEqualTypeOf<
        NEW_LocationResolved<TMatcherRecord>
      >()
      expectTypeOf(matcher.resolve('/foo')).toEqualTypeOf<
        NEW_LocationResolved<TMatcherRecord>
      >()
    })

    it('fails on non absolute location without a currentLocation', () => {
      // @ts-expect-error: needs currentLocation
      matcher.resolve('foo')
      // @ts-expect-error: needs currentLocation
      matcher.resolve({ path: 'foo' })
    })

    it('resolves relative locations', () => {
      expectTypeOf(
        matcher.resolve(
          { path: 'foo' },
          {} as NEW_LocationResolved<TMatcherRecord>
        )
      ).toEqualTypeOf<NEW_LocationResolved<TMatcherRecord>>()
      expectTypeOf(
        matcher.resolve('foo', {} as NEW_LocationResolved<TMatcherRecord>)
      ).toEqualTypeOf<NEW_LocationResolved<TMatcherRecord>>()
    })

    it('resolved named locations', () => {
      expectTypeOf(matcher.resolve({ name: 'foo', params: {} })).toEqualTypeOf<
        NEW_LocationResolved<TMatcherRecord>
      >()
    })

    it('fails on object relative location without a currentLocation', () => {
      // @ts-expect-error: needs currentLocation
      matcher.resolve({ params: { id: '1' } })
      // @ts-expect-error: needs currentLocation
      matcher.resolve({ query: { id: '1' } })
    })

    it('resolves object relative locations with a currentLocation', () => {
      expectTypeOf(
        matcher.resolve(
          { params: { id: 1 } },
          {} as NEW_LocationResolved<TMatcherRecord>
        )
      ).toEqualTypeOf<NEW_LocationResolved<TMatcherRecord>>()
    })
  })

  it('does not allow a name + path', () => {
    matcher.resolve({
      // ...({} as NEW_LocationResolved<TMatcherRecord>),
      name: 'foo',
      params: {},
      // @ts-expect-error: name + path
      path: '/e',
    })
    matcher.resolve(
      // @ts-expect-error: name + currentLocation
      { name: 'a', params: {} },
      //
      {} as NEW_LocationResolved<TMatcherRecord>
    )
  })
})
