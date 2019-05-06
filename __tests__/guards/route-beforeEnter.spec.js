// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom, noGuard, tick } = require('../utils')

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
const Foo = { template: `<div>Foo</div>` }

const beforeEnter = jest.fn()
const beforeEnters = [jest.fn(), jest.fn()]
/** @type {RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/home', component: Home, beforeEnter },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    component: Foo,
    beforeEnter,
  },
  {
    path: '/multiple',
    beforeEnter: beforeEnters,
    component: Foo,
  },
]

function resetMocks() {
  beforeEnter.mockReset()
  beforeEnters.forEach(spy => {
    spy.mockReset()
    spy.mockImplementationOnce(noGuard)
  })
}

beforeEach(() => {
  resetMocks()
})

describe('beforeEnter', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeEnter guards on navigation', async () => {
        const router = createRouter({ routes })
        beforeEnter.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/guard/valid')
        expect(beforeEnter).toHaveBeenCalledTimes(1)
      })

      it('supports an array of beforeEnter', async () => {
        const router = createRouter({ routes })
        await router[navigationMethod]('/multiple')
        expect(beforeEnters[0]).toHaveBeenCalledTimes(1)
        expect(beforeEnters[1]).toHaveBeenCalledTimes(1)
        expect(beforeEnters[0]).toHaveBeenCalledWith(
          expect.objectContaining({ path: '/multiple' }),
          expect.objectContaining({ path: '/' }),
          expect.any(Function)
        )
      })

      it('calls beforeEnter different records, same component', async () => {
        const router = createRouter({ routes })
        beforeEnter.mockImplementationOnce(noGuard)
        await router.push('/')
        expect(beforeEnter).not.toHaveBeenCalled()
        await router[navigationMethod]('/home')
        expect(beforeEnter).toHaveBeenCalledTimes(1)
      })

      it('does not call beforeEnter guard if we were already on the page', async () => {
        const router = createRouter({ routes })
        beforeEnter.mockImplementation(noGuard)
        await router.push('/guard/one')
        expect(beforeEnter).toHaveBeenCalledTimes(1)
        await router[navigationMethod]('/guard/one')
        expect(beforeEnter).toHaveBeenCalledTimes(1)
      })

      it('waits before navigating', async () => {
        const [promise, resolve] = fakePromise()
        const router = createRouter({ routes })
        beforeEnter.mockImplementationOnce(async (to, from, next) => {
          await promise
          next()
        })
        const p = router[navigationMethod]('/foo')
        expect(router.currentRoute.fullPath).toBe('/')
        resolve()
        await p
        expect(router.currentRoute.fullPath).toBe('/foo')
      })

      it('waits before navigating in an array of beforeEnter', async () => {
        const [p1, r1] = fakePromise()
        const [p2, r2] = fakePromise()
        const router = createRouter({ routes })
        beforeEnters[0].mockImplementationOnce(async (to, from, next) => {
          await p1
          next()
        })
        beforeEnters[1].mockImplementationOnce(async (to, from, next) => {
          await p2
          next()
        })
        const p = router[navigationMethod]('/multiple')
        expect(router.currentRoute.fullPath).toBe('/')
        expect(beforeEnters[1]).not.toHaveBeenCalled()
        r1()
        await p1
        await tick()
        r2()
        await p
        expect(router.currentRoute.fullPath).toBe('/multiple')
      })
    })
  })
})
