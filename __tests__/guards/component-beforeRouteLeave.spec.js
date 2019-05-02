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

const beforeRouteLeave = jest.fn()
/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard',
    component: {
      ...Foo,
      beforeRouteLeave,
    },
  },
]

beforeEach(() => {
  beforeRouteLeave.mockReset()
})

describe('beforeRouteLeave', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeRouteLeave guard on navigation', async () => {
        const router = createRouter({ routes })
        beforeRouteLeave.mockImplementationOnce((to, from, next) => {
          if (to.path === 'foo') next(false)
          else next()
        })
        await router.push('/guard')
        expect(beforeRouteLeave).not.toHaveBeenCalled()

        await router[navigationMethod]('/foo')
        expect(beforeRouteLeave).toHaveBeenCalledTimes(1)
      })

      it('works when a lazy loaded component', async () => {
        const router = createRouter({
          routes: [
            ...routes,
            {
              path: '/lazy',
              component: () => Promise.resolve({ ...Foo, beforeRouteLeave }),
            },
          ],
        })
        beforeRouteLeave.mockImplementationOnce((to, from, next) => {
          next()
        })
        await router.push('/lazy')
        expect(beforeRouteLeave).not.toHaveBeenCalled()
        await router[navigationMethod]('/foo')
        expect(beforeRouteLeave).toHaveBeenCalledTimes(1)
      })

      it('can cancel navigation', async () => {
        const router = createRouter({ routes })
        beforeRouteLeave.mockImplementationOnce(async (to, from, next) => {
          next(false)
        })
        await router.push('/guard')
        const p = router[navigationMethod]('/')
        expect(router.currentRoute.fullPath).toBe('/guard')
        await p.catch(err => {}) // catch the navigation abortion
        expect(router.currentRoute.fullPath).toBe('/guard')
      })
    })
  })
})
