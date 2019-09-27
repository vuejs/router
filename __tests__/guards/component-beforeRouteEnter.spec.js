// @ts-check
const { HTML5History } = require('../../src/history/html5')
const { Router } = require('../../src/router')
const fakePromise = require('faked-promise')
const { NAVIGATION_TYPES, createDom, noGuard } = require('../utils')

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

const beforeRouteEnter = jest.fn()
const named = {
  default: jest.fn(),
  other: jest.fn(),
}

const nested = {
  parent: jest.fn(),
  nestedEmpty: jest.fn(),
  nestedA: jest.fn(),
  nestedAbs: jest.fn(),
  nestedNested: jest.fn(),
  nestedNestedFoo: jest.fn(),
  nestedNestedParam: jest.fn(),
}

/** @type {RouteRecord[]} */
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
  {
    path: '/nested',
    component: {
      ...Home,
      beforeRouteEnter: nested.parent,
    },
    children: [
      {
        path: '',
        name: 'nested-empty-path',
        component: { ...Home, beforeRouteEnter: nested.nestedEmpty },
      },
      {
        path: 'a',
        name: 'nested-path',
        component: { ...Home, beforeRouteEnter: nested.nestedA },
      },
      {
        path: '/abs-nested',
        name: 'absolute-nested',
        component: { ...Home, beforeRouteEnter: nested.nestedAbs },
      },
      {
        path: 'nested',
        name: 'nested-nested',
        component: { ...Home, beforeRouteEnter: nested.nestedNested },
        children: [
          {
            path: 'foo',
            name: 'nested-nested-foo',
            component: { ...Home, beforeRouteEnter: nested.nestedNestedFoo },
          },
          {
            path: 'param/:p',
            name: 'nested-nested-param',
            component: { ...Home, beforeRouteEnter: nested.nestedNestedParam },
          },
        ],
      },
    ],
  },
]

function resetMocks() {
  beforeRouteEnter.mockReset()
  for (const key in named) {
    named[key].mockReset()
  }
  for (const key in nested) {
    nested[key].mockReset()
    nested[key].mockImplementation(noGuard)
  }
}

beforeEach(() => {
  resetMocks()
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

      it('calls beforeRouteEnter guards on navigation for nested views', async () => {
        const router = createRouter({ routes })
        await router[navigationMethod]('/nested/nested/foo')
        expect(nested.parent).toHaveBeenCalledTimes(1)
        expect(nested.nestedNested).toHaveBeenCalledTimes(1)
        expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
        expect(nested.nestedAbs).not.toHaveBeenCalled()
        expect(nested.nestedA).not.toHaveBeenCalled()
      })

      it('calls beforeRouteEnter guards on navigation for nested views', async () => {
        const router = createRouter({ routes })
        await router[navigationMethod]('/nested/nested/foo')
        expect(nested.parent).toHaveBeenCalledTimes(1)
        expect(nested.nestedNested).toHaveBeenCalledTimes(1)
        expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
      })

      it('calls beforeRouteEnter guards on non-entered nested routes', async () => {
        const router = createRouter({ routes })
        await router.push('/nested/nested')
        resetMocks()
        await router[navigationMethod]('/nested/nested/foo')
        expect(nested.parent).not.toHaveBeenCalled()
        expect(nested.nestedNested).not.toHaveBeenCalled()
        expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
      })

      it('does not call beforeRouteEnter guards on param change', async () => {
        const router = createRouter({ routes })
        await router.push('/nested/nested/param/1')
        resetMocks()
        await router[navigationMethod]('/nested/nested/param/2')
        expect(nested.parent).not.toHaveBeenCalled()
        expect(nested.nestedNested).not.toHaveBeenCalled()
        expect(nested.nestedNestedParam).not.toHaveBeenCalled()
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
