// @ts-check
require('../helper')
const expect = require('expect')
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom, noGuard } = require('../utils')

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
const named = {
  default: jest.fn(),
  other: jest.fn(),
}
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
  {
    path: '/named',
    components: {
      default: {
        ...Home,
        beforeRouteEnter: named.default,
      },
      other: {
        ...Foo,
        beforeRouteEnter: named.other,
      },
    },
  },
]

beforeEach(() => {
  beforeRouteEnter.mockReset()
  named.default.mockReset()
  named.other.mockReset()
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

      it('calls beforeRouteEnter guards on navigation for named views', async () => {
        const router = createRouter({ routes })
        named.default.mockImplementationOnce(noGuard)
        named.other.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/named')
        expect(named.default).toHaveBeenCalledTimes(1)
        expect(named.other).toHaveBeenCalledTimes(1)
        expect(router.currentRoute.fullPath).toBe('/named')
      })

      it('aborts navigation if one of the named views aborts', async () => {
        const router = createRouter({ routes })
        named.default.mockImplementationOnce((to, from, next) => {
          next(false)
        })
        named.other.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/named').catch(err => {}) // catch abort
        expect(named.default).toHaveBeenCalledTimes(1)
        expect(router.currentRoute.fullPath).not.toBe('/named')
      })

      it('resolves async components before guarding', async () => {
        const spy = jest.fn(noGuard)
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

      it('does not call beforeRouteEnter if we were already on the page', async () => {
        const router = createRouter({ routes })
        beforeRouteEnter.mockImplementation(noGuard)
        await router.push('/guard/one')
        expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
        await router[navigationMethod]('/guard/one')
        expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
      })

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
