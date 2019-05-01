// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom } = require('../utils')

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

const beforeEnter = jest.fn()
/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    component: Foo,
    beforeEnter,
  },
]

beforeEach(() => {
  beforeEnter.mockReset()
})

describe('beforeEnter', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeEnter guards on navigation', async () => {
        const router = createRouter({ routes })
        beforeEnter.mockImplementationOnce((to, from, next) => {
          if (to.params.n !== 'valid') return next(false)
          next()
        })
        await router[navigationMethod]('/guard/valid')
        expect(beforeEnter).toHaveBeenCalledTimes(1)
      })

      it.skip('calls beforeEnter guards on replace', () => {})
      it.skip('does not call beforeEnter guard if we were already on the page', () => {})

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
    })
  })
})
