import { describe, expectTypeOf, it } from 'vitest'
import type { RouteRecordRaw } from '../../types'
import { createMemoryHistory } from '../../history/memory'
import { MatcherPatternPathStatic } from './matchers/matcher-pattern'
import {
  normalizeRouteRecord,
  experimental_createRouter,
  type EXPERIMENTAL_Router,
  type EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from '../router'
import {
  createDynamicResolver,
  type EXPERIMENTAL_ResolverDynamic,
} from './resolver-dynamic'
import {
  createFixedResolver,
  type EXPERIMENTAL_ResolverFixed,
} from './resolver-fixed'

const component = {}

describe('createDynamicResolver', () => {
  it('accepts classic route records', () => {
    const routes: RouteRecordRaw[] = [
      { path: '/', component },
      {
        path: '/users/:id',
        name: 'user',
        component,
        alias: ['/u/:id'],
        children: [{ path: 'posts', component, props: true }],
      },
      { path: '/old', redirect: '/' },
    ]
    createDynamicResolver(routes)
    createDynamicResolver()
    // @ts-expect-error: global options were removed
    createDynamicResolver(routes, { strict: true })
  })

  it('accepts experimental route records mixed with classic ones', () => {
    const parent = normalizeRouteRecord({
      name: 'parent',
      path: new MatcherPatternPathStatic('/parent'),
      components: { default: component },
    })
    const resolver = createDynamicResolver([
      parent,
      { path: '/about', component },
      {
        name: 'child',
        path: new MatcherPatternPathStatic('/parent/child'),
        components: { default: component },
        parent,
      },
    ])
    resolver.addRoute(parent)
    resolver.addRoute('parent', { path: 'other', component })
  })

  it('adds routes with or without a parent', () => {
    const resolver = createDynamicResolver()
    expectTypeOf(resolver.addRoute({ path: '/a', component })).toEqualTypeOf<
      () => void
    >()
    expectTypeOf(
      resolver.addRoute('parent', { path: 'a', component })
    ).toEqualTypeOf<() => void>()
    // @ts-expect-error: path is required
    resolver.addRoute({ component })
  })

  it('creates a router with dynamic routing methods', () => {
    const router = experimental_createRouter({
      history: createMemoryHistory(),
      resolver: createDynamicResolver(),
    })
    expectTypeOf(router).toEqualTypeOf<
      EXPERIMENTAL_Router<
        EXPERIMENTAL_ResolverDynamic<EXPERIMENTAL_RouteRecordNormalized_Matchable>
      >
    >()
    // usable where any experimental router is expected
    expectTypeOf(router).toExtend<EXPERIMENTAL_Router>()
    expectTypeOf(router.addRoute({ path: '/a', component })).toEqualTypeOf<
      () => void
    >()
    router.addRoute('parent', { path: 'a', component })
    router.removeRoute('a')
    router.clearRoutes()
    expectTypeOf(router.getRoute('a')).toEqualTypeOf<
      EXPERIMENTAL_RouteRecordNormalized_Matchable | undefined
    >()
    expectTypeOf(router.resolver).toEqualTypeOf<
      EXPERIMENTAL_ResolverDynamic<EXPERIMENTAL_RouteRecordNormalized_Matchable>
    >()
    router.resolver.addRoute('parent', { path: 'a', component })
  })

  it('types the resolver of a router with a fixed resolver', () => {
    const router = experimental_createRouter({
      history: createMemoryHistory(),
      resolver:
        createFixedResolver<EXPERIMENTAL_RouteRecordNormalized_Matchable>([]),
    })
    expectTypeOf(router).toEqualTypeOf<
      EXPERIMENTAL_Router<
        EXPERIMENTAL_ResolverFixed<EXPERIMENTAL_RouteRecordNormalized_Matchable>
      >
    >()
    expectTypeOf(router).toExtend<EXPERIMENTAL_Router>()
    expectTypeOf(router.resolver).toEqualTypeOf<
      EXPERIMENTAL_ResolverFixed<EXPERIMENTAL_RouteRecordNormalized_Matchable>
    >()
    // @ts-expect-error: not available with a fixed resolver
    router.resolver.addRoute({ path: '/a', component })
    // the deprecated router methods exist but warn at runtime
    router.addRoute({ path: '/a', component })
  })
})
