import fakePromise from 'faked-promise'
import { createDom, noGuard, newRouter as createRouter } from '../utils'
import { RouteRecordRaw, NavigationGuard } from '../../src/types'

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const beforeRouteEnter = jest.fn<
  ReturnType<NavigationGuard>,
  Parameters<NavigationGuard>
>()
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

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:n',
    alias: '/guard-alias/:n',
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
    named[key as keyof typeof named].mockReset()
  }
  for (const key in nested) {
    nested[key as keyof typeof nested].mockReset()
    nested[key as keyof typeof nested].mockImplementation(noGuard)
  }
}

beforeEach(() => {
  resetMocks()
})

describe('beforeRouteEnter', () => {
  beforeAll(() => {
    createDom()
  })

  it('calls beforeRouteEnter guards on navigation', async () => {
    const router = createRouter({ routes })
    beforeRouteEnter.mockImplementationOnce((to, from, next) => {
      if (to.params.n !== 'valid') return next(false)
      next()
    })
    await router.push('/guard/valid')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
  })

  it('does not call beforeRouteEnter guards on navigation between aliases', async () => {
    const router = createRouter({ routes })
    const spy = jest.fn()
    beforeRouteEnter.mockImplementation(spy)
    await router.push('/guard/valid')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
    await router.push('/guard-alias/valid')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
    await router.push('/guard-alias/other')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
    await router.push('/guard/other')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
  })

  it('calls beforeRouteEnter guards on navigation for nested views', async () => {
    const router = createRouter({ routes })
    await router.push('/nested/nested/foo')
    expect(nested.parent).toHaveBeenCalledTimes(1)
    expect(nested.nestedNested).toHaveBeenCalledTimes(1)
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
    expect(nested.nestedAbs).not.toHaveBeenCalled()
    expect(nested.nestedA).not.toHaveBeenCalled()
  })

  it('calls beforeRouteEnter guards on navigation for nested views', async () => {
    const router = createRouter({ routes })
    await router.push('/nested/nested/foo')
    expect(nested.parent).toHaveBeenCalledTimes(1)
    expect(nested.nestedNested).toHaveBeenCalledTimes(1)
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
  })

  it('calls beforeRouteEnter guards on non-entered nested routes', async () => {
    const router = createRouter({ routes })
    await router.push('/nested/nested')
    resetMocks()
    await router.push('/nested/nested/foo')
    expect(nested.parent).not.toHaveBeenCalled()
    expect(nested.nestedNested).not.toHaveBeenCalled()
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
  })

  it('does not call beforeRouteEnter guards on param change', async () => {
    const router = createRouter({ routes })
    await router.push('/nested/nested/param/1')
    resetMocks()
    await router.push('/nested/nested/param/2')
    expect(nested.parent).not.toHaveBeenCalled()
    expect(nested.nestedNested).not.toHaveBeenCalled()
    expect(nested.nestedNestedParam).not.toHaveBeenCalled()
  })

  it('calls beforeRouteEnter guards on navigation for named views', async () => {
    const router = createRouter({ routes })
    named.default.mockImplementationOnce(noGuard)
    named.other.mockImplementationOnce(noGuard)
    await router.push('/named')
    expect(named.default).toHaveBeenCalledTimes(1)
    expect(named.other).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/named')
  })

  it('aborts navigation if one of the named views aborts', async () => {
    const router = createRouter({ routes })
    named.default.mockImplementationOnce((to, from, next) => {
      next(false)
    })
    named.other.mockImplementationOnce(noGuard)
    await router.push('/named').catch(err => {}) // catch abort
    expect(named.default).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).not.toBe('/named')
  })

  it('does not call beforeRouteEnter if we were already on the page', async () => {
    const router = createRouter({ routes })
    beforeRouteEnter.mockImplementation(noGuard)
    await router.push('/guard/one')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
    await router.push('/guard/one')
    expect(beforeRouteEnter).toHaveBeenCalledTimes(1)
  })

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    beforeRouteEnter.mockImplementationOnce(async (to, from, next) => {
      await promise
      next()
    })
    const p = router.push('/foo')
    expect(router.currentRoute.value.fullPath).toBe('/')
    resolve()
    await p
    expect(router.currentRoute.value.fullPath).toBe('/foo')
  })
})
