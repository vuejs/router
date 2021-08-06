import {
  createRouter,
  createWebHistory,
  expectType,
  isNavigationFailure,
  NavigationFailure,
  NavigationFailureType,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './index'

const router = createRouter({
  history: createWebHistory(),
  routes: [],
})

router.beforeEach((to, from) => {
  return { path: '/' }
})

router.beforeEach((to, from) => {
  return '/'
})

router.beforeEach((to, from) => {
  return false
})

router.beforeEach((to, from, next) => {
  next(undefined)
})

// @ts-expect-error
router.beforeEach((to, from, next) => {
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
  expectType<NavigationFailure | undefined | void>(failure)
  if (isNavigationFailure(failure)) {
    expectType<RouteLocationNormalized>(failure.from)
    expectType<RouteLocationRaw>(failure.to)
  }
  if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
    expectType<RouteLocationNormalized>(failure.from)
    expectType<RouteLocationRaw>(failure.to)
  }
})
