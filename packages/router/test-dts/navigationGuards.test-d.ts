import { expectTypeOf, describe, it } from 'vitest'
import type {
  NavigationFailure,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './index'
import {
  createRouter,
  createWebHistory,
  isNavigationFailure,
  NavigationFailureType,
} from './index'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

describe('Navigation guards', () => {
  // TODO: split into multiple tests
  it('works', () => {
    router.beforeEach((_to, _from) => {
      return { path: '/' }
    })

    router.beforeEach((_to, _from) => {
      return '/'
    })

    router.beforeEach((_to, _from) => {
      return false
    })

    router.beforeEach((to, from, next) => {
      next(undefined)
    })

    // @ts-expect-error
    router.beforeEach((_to, _from, _next) => {
      return Symbol('not supported')
    })
    // @ts-expect-error
    router.beforeEach(() => {
      return Symbol('not supported')
    })

    router.beforeEach((to, from, next) => {
      // @ts-expect-error
      next(Symbol('not supported'))
    })

    router.afterEach((to, from, failure) => {
      expectTypeOf<NavigationFailure | undefined | void>(failure)
      if (isNavigationFailure(failure)) {
        expectTypeOf<RouteLocationNormalized>(failure.from)
        expectTypeOf<RouteLocationRaw>(failure.to)
      }
      if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
        expectTypeOf<RouteLocationNormalized>(failure.from)
        expectTypeOf<RouteLocationRaw>(failure.to)
      }
    })
  })
})
