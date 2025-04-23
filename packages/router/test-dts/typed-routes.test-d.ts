import { describe, it, expectTypeOf } from 'vitest'
import {
  type RouteRecordInfo,
  type ParamValue,
  type ParamValueOneOrMore,
  type RouteLocationTyped,
  type RouteMeta,
  createRouter,
  createWebHistory,
  useRoute,
  RouteLocationNormalizedLoadedTypedList,
} from './index'

// type is needed instead of an interface
// https://github.com/microsoft/TypeScript/issues/15300
export type RouteMap = {
  '/[...path]': RouteRecordInfo<
    '/[...path]',
    '/:path(.*)',
    { path: ParamValue<true> },
    { path: ParamValue<false> },
    RouteMeta,
    never
  >
  '/[a]': RouteRecordInfo<
    '/[a]',
    '/:a',
    { a: ParamValue<true> },
    { a: ParamValue<false> },
    RouteMeta,
    never
  >
  '/a': RouteRecordInfo<
    '/a',
    '/a',
    Record<never, never>,
    Record<never, never>,
    RouteMeta,
    '/a/b'
  >
  '/a/b': RouteRecordInfo<
    '/a/b',
    '/a/b',
    Record<never, never>,
    Record<never, never>,
    RouteMeta,
    '/a/b/c'
  >
  '/a/b/c': RouteRecordInfo<
    '/a/b/c',
    '/a/b/c',
    Record<never, never>,
    Record<never, never>,
    RouteMeta,
    never
  >
  '/[id]+': RouteRecordInfo<
    '/[id]+',
    '/:id+',
    { id: ParamValueOneOrMore<true> },
    { id: ParamValueOneOrMore<false> },
    RouteMeta,
    never
  >
}

// the type allows for type params to distribute types:
// RouteLocationNormalizedLoadedLoaded<'/[a]' | '/'> will become RouteLocationNormalizedLoadedTyped<RouteMap>['/[a]'] | RouteLocationTypedList<RouteMap>['/']
// it's closer to what the end users uses but with the RouteMap type fixed so it doesn't
// pollute globals
type RouteLocationNormalizedLoaded<
  Name extends keyof RouteMap = keyof RouteMap,
> = RouteLocationNormalizedLoadedTypedList<RouteMap>[Name]
// type Test = RouteLocationNormalizedLoaded<'/a' | '/a/b' | '/a/b/c'>

declare module './index' {
  interface TypesConfig {
    RouteNamedMap: RouteMap
  }
}

describe('RouterTyped', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [],
  })

  it('resolve', () => {
    expectTypeOf<Record<never, never>>(router.resolve({ name: '/a' }).params)
    expectTypeOf<{ a: ParamValue<true> }>(
      router.resolve({ name: '/[a]' }).params
    )

    expectTypeOf<RouteLocationTyped<RouteMap, '/a'>>(
      router.resolve({ name: '/a' })
    )
    expectTypeOf<'/a'>(
      // @ts-expect-error: cannot infer based on path
      router.resolve({ path: '/a' }).name
    )
    expectTypeOf<keyof RouteMap>(router.resolve({ path: '/a' }).name)
  })

  it('resolve', () => {
    router.push({ name: '/a', params: { a: 2 } })
    // @ts-expect-error
    router.push({ name: '/[a]', params: {} })
    // still allow relative params
    router.push({ name: '/[a]' })
    // @ts-expect-error
    router.push({ name: '/[a]', params: { a: [2] } })
    router.push({ name: '/[id]+', params: { id: [2] } })
    router.push({ name: '/[id]+', params: { id: [2, '3'] } })
    // @ts-expect-error
    router.push({ name: '/[id]+', params: { id: 2 } })
  })

  it('beforeEach', () => {
    router.beforeEach((to, from) => {
      // @ts-expect-error: no route named this way
      if (to.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      // @ts-expect-error: no route named this way
      if (from.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      if (Math.random()) {
        return { name: '/[a]', params: { a: 2 } }
      } else if (Math.random()) {
        return '/any route does'
      }
      return true
    })
  })

  it('beforeResolve', () => {
    router.beforeResolve((to, from) => {
      // @ts-expect-error: no route named this way
      if (to.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      // @ts-expect-error: no route named this way
      if (from.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      if (Math.random()) {
        return { name: '/[a]', params: { a: 2 } }
      } else if (Math.random()) {
        return '/any route does'
      }
      return true
    })
  })

  it('afterEach', () => {
    router.afterEach((to, from) => {
      // @ts-expect-error: no route named this way
      if (to.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      // @ts-expect-error: no route named this way
      if (from.name === '/[id]') {
      } else if (to.name === '/[a]') {
        expectTypeOf<{ a: ParamValue<true> }>(to.params)
      }
      if (Math.random()) {
        return { name: '/[a]', params: { a: 2 } }
      } else if (Math.random()) {
        return '/any route does'
      }
      return true
    })
  })

  it('useRoute', () => {
    expectTypeOf(useRoute('/[a]')).toEqualTypeOf<
      RouteLocationNormalizedLoaded<'/[a]'>
    >()
    expectTypeOf(useRoute('/a')).toEqualTypeOf<
      RouteLocationNormalizedLoaded<'/a' | '/a/b' | '/a/b/c'>
    >()
    expectTypeOf(useRoute('/a/b')).toEqualTypeOf<
      RouteLocationNormalizedLoaded<'/a/b' | '/a/b/c'>
    >()
    expectTypeOf(useRoute('/a/b/c')).toEqualTypeOf<
      RouteLocationNormalizedLoaded<'/a/b/c'>
    >()
  })
})
