import { describe, it, expectTypeOf } from 'vitest'
import type {
  RouteRecordName,
  ParamValue,
  ParamValueZeroOrMore,
  RouteRecordInfo,
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
    { other: ParamValue<false> }
  >
  '/[name]': RouteRecordInfo<
    '/[name]',
    '/:name',
    { name: ParamValue<true> },
    { name: ParamValue<false> }
  >
  '/[...path]': RouteRecordInfo<
    '/[...path]',
    '/:path(.*)',
    { path: ParamValue<true> },
    { path: ParamValue<false> }
  >
  '/deep/nesting/works/[[files]]+': RouteRecordInfo<
    '/deep/nesting/works/[[files]]+',
    '/deep/nesting/works/:files*',
    { files?: ParamValueZeroOrMore<true> },
    { files?: ParamValueZeroOrMore<false> }
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

    withRoute('/[name]', to => {
      expectTypeOf(to.params).toEqualTypeOf<{ name: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ notExisting: string }>()
      expectTypeOf(to.params).not.toEqualTypeOf<{ other: string }>()
    })

    withRoute('/[name]' as keyof RouteNamedMap, to => {
      // @ts-expect-error: no all params have this
      to.params.name
      if (to.name === '/[name]') {
        to.params.name
        // @ts-expect-error: no param other
        to.params.other
      }
    })

    withRoute(to => {
      // @ts-expect-error: not all params object have a name
      to.params.name
      // @ts-expect-error: no route named like that
      if (to.name === '') {
      }
      if (to.name === '/[name]') {
        expectTypeOf(to.params).toEqualTypeOf<{ name: string }>()
        // @ts-expect-error: no param other
        to.params.other
      }
    })
  })
})
