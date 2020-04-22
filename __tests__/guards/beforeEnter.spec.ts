import fakePromise from 'faked-promise'
import { createDom, noGuard, tick, newRouter as createRouter } from '../utils'
import { RouteRecordRaw } from '../../src/types'

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const beforeEnter = jest.fn()
const beforeEnters = [jest.fn(), jest.fn()]
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
  beforeEnter.mockReset()
  beforeEnters.forEach(spy => {
    spy.mockReset()
    spy.mockImplementationOnce(noGuard)
  })
  for (const key in nested) {
    nested[key as keyof typeof nested].mockReset()
    nested[key as keyof typeof nested].mockImplementation(noGuard)
  }
}

beforeEach(() => {
  resetMocks()
})

describe('beforeEnter', () => {
  beforeAll(() => {
    createDom()
  })

  it('calls beforeEnter guards on navigation', async () => {
    const router = createRouter({ routes })
    beforeEnter.mockImplementationOnce(noGuard)
    await router.push('/guard/valid')
    expect(beforeEnter).toHaveBeenCalledTimes(1)
  })

  it('supports an array of beforeEnter', async () => {
    const router = createRouter({ routes })
    await router.push('/multiple')
    expect(beforeEnters[0]).toHaveBeenCalledTimes(1)
    expect(beforeEnters[1]).toHaveBeenCalledTimes(1)
    expect(beforeEnters[0]).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/multiple' }),
      expect.objectContaining({ path: '/' }),
      expect.any(Function)
    )
  })

  it('call beforeEnter in nested views', async () => {
    const router = createRouter({ routes })
    await router.push('/nested/a')
    resetMocks()
    await router.push('/nested/nested/foo')
    expect(nested.parent).not.toHaveBeenCalled()
    expect(nested.nestedA).not.toHaveBeenCalled()
    expect(nested.nestedNested).toHaveBeenCalledTimes(1)
    expect(nested.nestedNestedFoo).toHaveBeenCalledTimes(1)
    expect(nested.nestedNested).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/nested/nested/foo' }),
      expect.objectContaining({ path: '/nested/a' }),
      expect.any(Function)
    )
    expect(nested.nestedNestedFoo).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/nested/nested/foo' }),
      expect.objectContaining({ path: '/nested/a' }),
      expect.any(Function)
    )
  })

  it('calls beforeEnter different records, same component', async () => {
    const router = createRouter({ routes })
    beforeEnter.mockImplementationOnce(noGuard)
    await router.push('/')
    expect(beforeEnter).not.toHaveBeenCalled()
    await router.push('/home')
    expect(beforeEnter).toHaveBeenCalledTimes(1)
  })

  it('does not call beforeEnter guard if we were already on the page', async () => {
    const router = createRouter({ routes })
    beforeEnter.mockImplementation(noGuard)
    await router.push('/guard/one')
    expect(beforeEnter).toHaveBeenCalledTimes(1)
    await router.push('/guard/one')
    expect(beforeEnter).toHaveBeenCalledTimes(1)
  })

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    beforeEnter.mockImplementationOnce(async (to, from, next) => {
      await promise
      next()
    })
    const p = router.push('/foo')
    expect(router.currentRoute.value.fullPath).toBe('/')
    resolve()
    await p
    expect(router.currentRoute.value.fullPath).toBe('/foo')
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
    const p = router.push('/multiple')
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(beforeEnters[1]).not.toHaveBeenCalled()
    r1()
    await p1
    await tick()
    r2()
    await p
    expect(router.currentRoute.value.fullPath).toBe('/multiple')
  })
})
