import { describe, it, expectTypeOf } from 'vitest'
import type {
  RouteRecordName,
  ParamValue,
  ParamValueZeroOrMore,
  RouteRecordInfo,
  RouteMeta,
  RouteLocationNormalizedTypedList,
} from '../src'

// TODO: could we move this to an .d.ts file that is only loaded for tests?
// https://github.com/microsoft/TypeScript/issues/15300
type RouteNamedMap = {
  home: RouteRecordInfo<'/', '/', Record<never, never>, Record<never, never>>
  '/[other]': RouteRecordInfo<
    '/[other]',
    '/:other',
    { other: ParamValue<true> },
    { other: ParamValue<false> },
    RouteMeta,
    never
  >
  '/groups/[gid]': RouteRecordInfo<
    '/groups/[gid]',
    '/:gid',
    { gid: ParamValue<true> },
    { gid: ParamValue<false> },
    RouteMeta,
    '/groups/[gid]/users'
  >
  '/groups/[gid]/users': RouteRecordInfo<
    '/groups/[gid]/users',
    '/:gid/users',
    { gid: ParamValue<true> },
    { gid: ParamValue<false> },
    RouteMeta,
    '/groups/[gid]/users/[uid]'
  >
  '/groups/[gid]/users/[uid]': RouteRecordInfo<
    '/groups/[gid]/users/[uid]',
    '/:gid/users/:uid',
    { gid: ParamValue<true>; uid: ParamValue<true> },
    { gid: ParamValue<false>; uid: ParamValue<false> },
    RouteMeta,
    never
  >
  '/[...path]': RouteRecordInfo<
    '/[...path]',
    '/:path(.*)',
    { path: ParamValue<true> },
    { path: ParamValue<false> },
    RouteMeta,
    never
  >
  '/deep/nesting/works/[[files]]+': RouteRecordInfo<
    '/deep/nesting/works/[[files]]+',
    '/deep/nesting/works/:files*',
    { files?: ParamValueZeroOrMore<true> },
    { files?: ParamValueZeroOrMore<false> },
    RouteMeta,
    never
  >
}

describe('Route Location types', () => {
  it('RouteLocationNormalized', () => {
    function withRoute(
      fn: (
        to: RouteLocationNormalizedTypedList<RouteNamedMap>[keyof RouteNamedMap]
      ) => void
    ): void
    function withRoute<Name extends keyof RouteNamedMap>(
      name: Name,
      fn: (to: RouteLocationNormalizedTypedList<RouteNamedMap>[Name]) => void
    ): void
    function withRoute<Name extends RouteRecordName>(...args: unknown[]) {}

    withRoute('/groups/[gid]', to => {
      expectTypeOf(to.params).toEqualTypeOf<{ gid: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ notExisting: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ other: string }>()
    })

    withRoute('/groups/[gid]/users', to => {
      expectTypeOf(to.params).toEqualTypeOf<{ gid: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ gid: string; uid: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ other: string }>()
    })

    withRoute('/groups/[gid]/users/[uid]', to => {
      expectTypeOf(to.params).toEqualTypeOf<{ gid: string; uid: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ notExisting: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ other: string }>()
    })

    withRoute('/groups/[gid]' as keyof RouteNamedMap, to => {
      // @ts-expect-error: no all params have this
      to.params.gid
      if (to.name === '/groups/[gid]') {
        to.params.gid
        // @ts-expect-error: no param other
        to.params.other
      }
    })

    withRoute(to => {
      // @ts-expect-error: not all params object have a name
      to.params.gid
      // @ts-expect-error: no route named like that
      if (to.name === '') {
      }
      if (to.name === '/groups/[gid]') {
        expectTypeOf(to.params).toEqualTypeOf<{ gid: string }>()
        // @ts-expect-error: no param other
        to.params.other
      }
    })
  })
})
