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
      it('calls beforeEach guards on navigation', () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.beforeEach(spy)
        router[navigationMethod]('/foo')
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
        const guard1 = jest.fn(async (to, from, next) => {
          await p1
          next()
        })
        router.beforeEach(guard1)
        const guard2 = jest.fn(async (to, from, next) => {
          await p2
          next()
        })
        router.beforeEach(guard2)
        let navigation = router[navigationMethod]('/foo')
        expect(router.currentRoute.fullPath).toBe('/')
        expect(guard1).toHaveBeenCalled()
        expect(guard2).not.toHaveBeenCalled()
        r1()
        // wait until the guard is called
        await tick()
        await tick()
        expect(guard2).toHaveBeenCalled()
        r2()
        expect(router.currentRoute.fullPath).toBe('/')
        await navigation
        expect(guard2).toHaveBeenCalled()
        expect(router.currentRoute.fullPath).toBe('/foo')
      })
    })
  })
})
