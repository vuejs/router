import { describe, expectTypeOf, it } from 'vitest'
import type { RouteRecordRaw } from '../../types'
import { createMemoryHistory } from '../../history/memory'
import {
  experimental_createRouter,
  type EXPERIMENTAL_Router,
  type EXPERIMENTAL_RouterDynamic,
} from '../router'
import { createDynamicResolver } from './resolver-dynamic'
import { createFixedResolver } from './resolver-fixed'

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
    createDynamicResolver(routes, { strict: true })
    createDynamicResolver()
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
    expectTypeOf(router).toEqualTypeOf<EXPERIMENTAL_RouterDynamic>()
    expectTypeOf(router.addRoute({ path: '/a', component })).toEqualTypeOf<
      () => void
    >()
    router.addRoute('parent', { path: 'a', component })
    router.removeRoute('a')
    router.clearRoutes()
  })

  it('creates a router without dynamic routing methods with a fixed resolver', () => {
    const router = experimental_createRouter({
      history: createMemoryHistory(),
      resolver: createFixedResolver([]),
    })
    expectTypeOf(router).toEqualTypeOf<EXPERIMENTAL_Router>()
    // @ts-expect-error: not available with a fixed resolver
    router.addRoute({ path: '/a', component })
  })
})
