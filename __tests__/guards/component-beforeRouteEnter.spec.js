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

const beforeRouteEnter = jest.fn()
/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    component: {
      ...Foo,
      beforeRouteEnter,
    },
  },
]

beforeEach(() => {
  beforeRouteEnter.mockReset()
})

describe('beforeRouteEnter', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeRouteEnter guards on navigation', async () => {
        const router = createRouter({ routes })
        beforeRouteEnter.mockImplementationOnce((to, from, next) => {
          if (to.params.n !== 'valid') return next(false)
          next()
        })
        await router[navigationMethod]('/guard/valid')
        expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
      })

      it('resolves async components before guarding', async () => {
        const spy = jest.fn((to, from, next) => next())
        const component = {
          template: `<div></div>`,
          beforeRouteEnter: spy,
        }
        const [promise, resolve] = fakePromise()
        const router = createRouter({
          routes: [...routes, { path: '/async', component: () => promise }],
        })
        const pushPromise = router[navigationMethod]('/async')
        expect(spy).not.toHaveBeenCalled()
        resolve(component)
        await pushPromise

        expect(spy).toHaveBeenCalledTimes(1)
      })

      it.skip('does not call beforeRouteEnter if we were already on the page', () => {})

      it('waits before navigating', async () => {
        const [promise, resolve] = fakePromise()
        const router = createRouter({ routes })
        beforeRouteEnter.mockImplementationOnce(async (to, from, next) => {
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
