// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom, tick, noGuard } = require('../utils')

/** @typedef {import('../../src/types').RouteRecord} RouteRecord */
/** @typedef {import('../../src/router').RouterOptions} RouterOptions */

/**
 * @param {Partial<RouterOptions> & { routes: RouteRecord[]}} options
 */
function createRouter(options) {
  return new Router({
    history: new HTML5History(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Nested = { template: `<div>Nested<router-view/></div>` }
const Foo = { template: `<div>Foo</div>` }

/** @type {RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  { path: '/other', component: Foo },
  { path: '/n/:i', name: 'n', component: Home },
  {
    path: '/nested',
    component: Nested,
    children: [
      { path: '', name: 'nested-default', component: Foo },
      { path: 'home', name: 'nested-home', component: Home },
    ],
  },
]

describe('router.beforeEach', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeEach guards on navigation', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.beforeEach(spy)
        spy.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/foo')
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('can be removed', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        const remove = router.beforeEach(spy)
        remove()
        spy.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/foo')
        expect(spy).not.toHaveBeenCalled()
      })

      it('does not call beforeEach guard if we were already on the page', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        await router.push('/foo')
        router.beforeEach(spy)
        spy.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/foo')
        expect(spy).not.toHaveBeenCalled()
      })

      it('calls beforeEach guards on navigation between children routes', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        await router.push('/nested')
        router.beforeEach(spy)
        spy.mockImplementation(noGuard)
        await router[navigationMethod]('/nested/home')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenLastCalledWith(
          expect.objectContaining({ name: 'nested-home' }),
          expect.objectContaining({ name: 'nested-default' }),
          expect.any(Function)
        )
        await router[navigationMethod]('/nested')
        expect(spy).toHaveBeenLastCalledWith(
          expect.objectContaining({ name: 'nested-default' }),
          expect.objectContaining({ name: 'nested-home' }),
          expect.any(Function)
        )
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it('can redirect to a different location', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        await router.push('/foo')
        spy.mockImplementation((to, from, next) => {
          // only allow going to /other
          if (to.fullPath !== '/other') next('/other')
          else next()
        })
        router.beforeEach(spy)
        expect(spy).not.toHaveBeenCalled()
        await router[navigationMethod]('/')
        expect(spy).toHaveBeenCalledTimes(2)
        // called before redirect
        expect(spy).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({ path: '/' }),
          expect.objectContaining({ path: '/foo' }),
          expect.any(Function)
        )
        expect(spy).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({ path: '/other' }),
          expect.objectContaining({ path: '/foo' }),
          expect.any(Function)
        )
        expect(router.currentRoute.fullPath).toBe('/other')
      })

      async function assertRedirect(redirectFn) {
        const spy = jest.fn()
        const router = createRouter({ routes })
        await router.push('/')
        spy.mockImplementation((to, from, next) => {
          // only allow going to /other
          const i = Number(to.params.i)
          if (i >= 3) next()
          else next(redirectFn(i + 1))
        })
        router.beforeEach(spy)
        expect(spy).not.toHaveBeenCalled()
        await router[navigationMethod]('/n/0')
        expect(spy).toHaveBeenCalledTimes(4)
        expect(router.currentRoute.fullPath).toBe('/n/3')
      }

      it('can redirect multiple times with string redirect', async () => {
        await assertRedirect(i => '/n/' + i)
      })

      it('can redirect multiple times with path object', async () => {
        await assertRedirect(i => ({ path: '/n/' + i }))
      })

      it('can redirect multiple times with named route', async () => {
        await assertRedirect(i => ({ name: 'n', params: { i } }))
      })

      it('is called when changing params', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes: [...routes] })
        await router.push('/n/2')
        spy.mockImplementation(noGuard)
        router.beforeEach(spy)
        spy.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/n/1')
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('is not called with same params', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes: [...routes] })
        await router.push('/n/2')
        spy.mockImplementation(noGuard)
        router.beforeEach(spy)
        spy.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/n/2')
        expect(spy).not.toHaveBeenCalled()
      })

      it('waits before navigating', async () => {
        const [promise, resolve] = fakePromise()
        const router = createRouter({ routes })
        router.beforeEach(async (to, from, next) => {
          await promise
          next()
        })
        const p = router[navigationMethod]('/foo')
        expect(router.currentRoute.fullPath).toBe('/')
        resolve()
        await p
        expect(router.currentRoute.fullPath).toBe('/foo')
      })

      it('waits in the right order', async () => {
        const [p1, r1] = fakePromise()
        const [p2, r2] = fakePromise()
        const router = createRouter({ routes })
        const guard1 = jest.fn()
        let order = 0
        guard1.mockImplementationOnce(async (to, from, next) => {
          expect(order++).toBe(0)
          await p1
          next()
        })
        router.beforeEach(guard1)
        const guard2 = jest.fn()
        guard2.mockImplementationOnce(async (to, from, next) => {
          expect(order++).toBe(1)
          await p2
          next()
        })
        router.beforeEach(guard2)
        let navigation = router[navigationMethod]('/foo')
        expect(router.currentRoute.fullPath).toBe('/')
        expect(guard1).not.toHaveBeenCalled()
        expect(guard2).not.toHaveBeenCalled()
        r1() // resolve the first guard
        await tick() // wait a tick
        await tick() // mocha requires an extra tick here
        expect(guard1).toHaveBeenCalled()
        // we haven't resolved the second gurad yet
        expect(router.currentRoute.fullPath).toBe('/')
        r2()
        await navigation
        expect(guard2).toHaveBeenCalled()
        expect(router.currentRoute.fullPath).toBe('/foo')
      })
    })
  })
})
