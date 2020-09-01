import { createRouter, createWebHistory, expectType } from './index'
import { NavigationFailure } from 'dist/vue-router'

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
})
