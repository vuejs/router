// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom, tick } = require('../utils')

/**
 * @param {Partial<import('../../src/router').RouterOptions> & { routes: import('../../src/types').RouteRecord[]}} options
 */
function createRouter(options) {
  return new Router({
    history: new HTML5History(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
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
        spy.mockImplementationOnce((to, from, next) => {
          next()
        })
        await router[navigationMethod]('/foo')
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it.skip('does not call beforeEach guard if we were already on the page', () => {})

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
