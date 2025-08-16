import { describe, expectTypeOf, it } from 'vitest'
import { ResolverLocationResolved } from '../resolver-abstract'
import { NEW_MatcherRecordRaw } from './resolver-dynamic'
import { NEW_RouterResolver } from './resolver-dynamic'
import { EXPERIMENTAL_RouteRecordNormalized } from '../../router'

describe('Matcher', () => {
  type TMatcherRecordRaw = NEW_MatcherRecordRaw
  type TMatcherRecord = EXPERIMENTAL_RouteRecordNormalized

  const matcher: NEW_RouterResolver<TMatcherRecordRaw, TMatcherRecord> =
    {} as any

  describe('matcher.resolve()', () => {
    it('resolves absolute string locations', () => {
      expectTypeOf(matcher.resolve({ path: '/foo' })).toEqualTypeOf<
        ResolverLocationResolved<TMatcherRecord>
      >()
      expectTypeOf(matcher.resolve('/foo')).toEqualTypeOf<
        ResolverLocationResolved<TMatcherRecord>
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
          {} as ResolverLocationResolved<TMatcherRecord>
        )
      ).toEqualTypeOf<ResolverLocationResolved<TMatcherRecord>>()
      expectTypeOf(
        matcher.resolve('foo', {} as ResolverLocationResolved<TMatcherRecord>)
      ).toEqualTypeOf<ResolverLocationResolved<TMatcherRecord>>()
    })

    it('resolved named locations', () => {
      expectTypeOf(matcher.resolve({ name: 'foo', params: {} })).toEqualTypeOf<
        ResolverLocationResolved<TMatcherRecord>
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
          {} as ResolverLocationResolved<TMatcherRecord>
        )
      ).toEqualTypeOf<ResolverLocationResolved<TMatcherRecord>>()
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
      {} as ResolverLocationResolved<TMatcherRecord>
    )
  })
})
