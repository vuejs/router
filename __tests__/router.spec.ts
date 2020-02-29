import fakePromise from 'faked-promise'
import { createRouter, createMemoryHistory, createWebHistory } from '../src'
import { NavigationCancelled } from '../src/errors'
import { createDom, components, tick } from './utils'
import {
  RouteRecord,
  RouteLocation,
  START_LOCATION_NORMALIZED,
} from '../src/types'
import { RouterHistory } from '../src/history/common'

const routes: RouteRecord[] = [
  { path: '/', component: components.Home, name: 'home' },
  { path: '/home', redirect: '/' },
  {
    path: '/home-before',
    component: components.Home,
    beforeEnter: (to, from, next) => {
      next('/')
    },
  },
  { path: '/search', component: components.Home },
  { path: '/foo', component: components.Foo, name: 'Foo' },
  { path: '/to-foo', redirect: '/foo' },
  { path: '/to-foo-named', redirect: { name: 'Foo' } },
  { path: '/to-foo2', redirect: '/to-foo' },
  { path: '/p/:p', name: 'Param', component: components.Bar },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  {
    path: '/inc-query-hash',
    redirect: to => ({
      name: 'Foo',
      query: { n: to.query.n + '-2' },
      hash: to.hash + '-2',
    }),
  },
]

async function newRouter({ history }: { history?: RouterHistory } = {}) {
  history = history || createMemoryHistory()
  const router = createRouter({ history, routes })
  await router.push('/')

  return { history, router }
}

describe('Router', () => {
  beforeAll(() => {
    createDom()
  })

  it('can be instantiated', () => {
    const history = createMemoryHistory()
    const router = createRouter({ history, routes })
    expect(router.currentRoute.value).toEqual(START_LOCATION_NORMALIZED)
  })

  it('calls history.push with router.push', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'push')
    await router.push('/foo')
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push).toHaveBeenCalledWith(
      expect.objectContaining({
        fullPath: '/foo',
        path: '/foo',
        query: {},
        hash: '',
      })
    )
  })

  it('can do initial navigation to /', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    expect(router.currentRoute.value).toBe(START_LOCATION_NORMALIZED)
    await router.push('/')
    expect(router.currentRoute.value).not.toBe(START_LOCATION_NORMALIZED)
  })

  it('calls history.replace with router.replace', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    jest.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        fullPath: '/foo',
        path: '/foo',
        query: {},
        hash: '',
      })
    )
  })

  it('can pass replace option to push', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'replace')
    await router.push({ path: '/foo', replace: true })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith(
      expect.objectContaining({
        fullPath: '/foo',
        path: '/foo',
        query: {},
        hash: '',
      })
    )
  })

  describe('navigation', () => {
    async function checkNavigationCancelledOnPush(
      target?: RouteLocation | false | ((vm: any) => void)
    ) {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      router.beforeEach(async (to, from, next) => {
        if (to.name !== 'Param') return next()
        if (to.params.p === 'a') {
          await p1
          // @ts-ignore: for some reason it's not handling the string here
          target == null ? next() : next(target)
        } else {
          await p2
          next()
        }
      })
      const pA = router.push('/p/a')
      const pB = router.push('/p/b')
      // we resolve the second navigation first then the first one
      // and the first navigation should be ignored because at that time
      // the second one will have already been resolved
      r2()
      await pB
      expect(router.currentRoute.value.fullPath).toBe('/p/b')
      r1()
      try {
        await pA
      } catch (err) {
        expect(err).toBeInstanceOf(NavigationCancelled)
      }
      expect(router.currentRoute.value.fullPath).toBe('/p/b')
    }

    it('cancels navigation abort if a newer one is finished on push', async () => {
      await checkNavigationCancelledOnPush(false)
    })

    it('cancels pending in-guard navigations if a newer one is finished on push', async () => {
      await checkNavigationCancelledOnPush('/foo')
    })

    it('cancels pending navigations if a newer one is finished on push', async () => {
      await checkNavigationCancelledOnPush(undefined)
    })

    async function checkNavigationCancelledOnPopstate(
      target?: RouteLocation | false | ((vm: any) => void)
    ) {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })

      // navigate first to add entries to the history stack
      await router.push('/foo')
      await router.push('/p/a')
      await router.push('/p/b')

      router.beforeEach(async (to, from, next) => {
        if (to.name !== 'Param') return next()
        if (to.fullPath === '/foo') {
          await p1
          next()
        } else if (from.fullPath === '/p/b') {
          await p2
          // @ts-ignore: same as function above
          next(target)
        } else {
          next()
        }
      })

      // trigger to history.back()
      history.back()
      history.back()

      expect(router.currentRoute.value.fullPath).toBe('/p/b')
      // resolves the last call to history.back() first
      // so we end up on /p/initial
      r1()
      await tick()
      expect(router.currentRoute.value.fullPath).toBe('/foo')
      // resolves the pending navigation, this should be cancelled
      r2()
      await tick()
      expect(router.currentRoute.value.fullPath).toBe('/foo')
    }

    it('cancels pending navigations if a newer one is finished on user navigation (from history)', async () => {
      await checkNavigationCancelledOnPopstate(undefined)
    })

    it('cancels pending in-guard navigations if a newer one is finished on user navigation (from history)', async () => {
      await checkNavigationCancelledOnPopstate('/p/other-place')
    })

    it('cancels navigation abort if a newer one is finished on user navigation (from history)', async () => {
      await checkNavigationCancelledOnPush(undefined)
    })
  })

  describe('redirectedFrom', () => {
    it('adds a redirectedFrom property with a redirect in record', async () => {
      const { router } = await newRouter({ history: createMemoryHistory() })
      // go to a different route first
      await router.push('/foo')
      await router.push('/home')
      expect(router.currentRoute.value).toMatchObject({
        path: '/',
        name: 'home',
        redirectedFrom: { path: '/home' },
      })
    })

    it('adds a redirectedFrom property with beforeEnter', async () => {
      const { router } = await newRouter({ history: createMemoryHistory() })
      // go to a different route first
      await router.push('/foo')
      await router.push('/home-before')
      expect(router.currentRoute.value).toMatchObject({
        path: '/',
        name: 'home',
        redirectedFrom: { path: '/home-before' },
      })
    })
  })

  describe('matcher', () => {
    // TODO: rewrite after redirect refactor
    it.skip('handles one redirect from route record', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      const loc = await router.push('/to-foo')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    // TODO: rewrite after redirect refactor
    it.skip('drops query and params on redirect if not provided', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      const loc = await router.push('/to-foo?hey=foo#fa')
      expect(loc.name).toBe('Foo')
      expect(loc.query).toEqual({})
      expect(loc.hash).toBe('')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    // TODO: rewrite after redirect refactor
    it.skip('allows object in redirect', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      const loc = await router.push('/to-foo-named')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo-named',
      })
    })

    // TODO: rewrite after redirect refactor
    it.skip('can pass on query and hash when redirecting', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      const loc = await router.push('/inc-query-hash?n=3#fa')
      expect(loc).toMatchObject({
        name: 'Foo',
        query: {
          n: '3-2',
        },
        hash: '#fa-2',
      })
      expect(loc.redirectedFrom).toMatchObject({
        fullPath: '/inc-query-hash?n=3#fa',
        path: '/inc-query-hash',
      })
    })
  })

  it('allows base option in abstract history', async () => {
    const history = createMemoryHistory('/app/')
    const router = createRouter({ history, routes })
    expect(router.currentRoute.value).toEqual({
      name: undefined,
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
      meta: {},
    })
    await router.replace('/foo')
    expect(router.currentRoute.value).toMatchObject({
      name: 'Foo',
      fullPath: '/foo',
      hash: '',
      params: {},
      path: '/foo',
      query: {},
    })
  })

  it('allows base option with html5 history', async () => {
    const history = createWebHistory('/app/')
    const router = createRouter({ history, routes })
    expect(router.currentRoute.value).toEqual({
      name: undefined,
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
      meta: {},
    })
    await router.replace('/foo')
    expect(router.currentRoute.value).toMatchObject({
      name: 'Foo',
      fullPath: '/foo',
      hash: '',
      params: {},
      path: '/foo',
      query: {},
    })
  })

  // it('redirects with route record redirect')

  describe('Dynamic Routing', () => {
    it('resolves new added routes', async () => {
      const { router } = await newRouter()
      expect(router.resolve('/new-route')).toMatchObject({
        name: undefined,
        matched: [],
      })
      router.addRoute({
        path: '/new-route',
        component: components.Foo,
        name: 'new route',
      })
      expect(router.resolve('/new-route')).toMatchObject({
        name: 'new route',
      })
    })

    it('can redirect to children in the middle of navigation', async () => {
      const { router } = await newRouter()
      expect(router.resolve('/new-route')).toMatchObject({
        name: undefined,
        matched: [],
      })
      let removeRoute: (() => void) | undefined
      router.addRoute({
        path: '/dynamic',
        component: components.Nested,
        name: 'dynamic parent',
        options: { end: false, strict: true },
        beforeEnter(to, from, next) {
          if (!removeRoute) {
            removeRoute = router.addRoute('dynamic parent', {
              path: 'child',
              name: 'dynamic child',
              component: components.Foo,
            })
            next(to.fullPath)
          } else next()
        },
      })

      router.push('/dynamic/child').catch(() => {})
      await tick()
      expect(router.currentRoute.value).toMatchObject({
        name: 'dynamic child',
      })
    })

    it('can reroute to a replaced route with the same component', async () => {
      const { router } = await newRouter()
      router.addRoute({
        path: '/new/foo',
        component: components.Foo,
        name: 'new',
      })
      // navigate to the route we just added
      await router.replace({ name: 'new' })
      // replace it
      router.addRoute({
        path: '/new/bar',
        component: components.Foo,
        name: 'new',
      })
      // navigate again
      await router.replace({ name: 'new' })
      expect(router.currentRoute.value).toMatchObject({
        path: '/new/bar',
        name: 'new',
      })
    })

    it('can reroute to child', async () => {
      const { router } = await newRouter()
      router.addRoute({
        path: '/new',
        component: components.Foo,
        children: [],
        name: 'new',
      })
      // navigate to the route we just added
      await router.replace('/new/child')
      // replace it
      router.addRoute('new', {
        path: 'child',
        component: components.Bar,
        name: 'new-child',
      })
      // navigate again
      await router.replace('/new/child')
      expect(router.currentRoute.value).toMatchObject({
        name: 'new-child',
      })
    })

    it('can reroute when adding a new route', async () => {
      const { router } = await newRouter()
      await router.push('/p/p')
      expect(router.currentRoute.value).toMatchObject({
        name: 'Param',
      })
      router.addRoute({
        path: '/p/p',
        component: components.Foo,
        name: 'pp',
      })
      await router.replace(router.currentRoute.value.fullPath)
      expect(router.currentRoute.value).toMatchObject({
        name: 'pp',
      })
    })

    it('stops resolving removed routes', async () => {
      const { router } = await newRouter()
      // regular route
      router.removeRoute('Foo')
      expect(router.resolve('/foo')).toMatchObject({
        name: undefined,
        matched: [],
      })
      // dynamic route
      const removeRoute = router.addRoute({
        path: '/new-route',
        component: components.Foo,
        name: 'new route',
      })
      removeRoute()
      expect(router.resolve('/new-route')).toMatchObject({
        name: undefined,
        matched: [],
      })
    })

    it('can reroute when removing route', async () => {
      const { router } = await newRouter()
      router.addRoute({
        path: '/p/p',
        component: components.Foo,
        name: 'pp',
      })
      await router.push('/p/p')
      router.removeRoute('pp')
      await router.replace(router.currentRoute.value.fullPath)
      expect(router.currentRoute.value).toMatchObject({
        name: 'Param',
      })
    })

    it('can reroute when removing route through returned function', async () => {
      const { router } = await newRouter()
      const remove = router.addRoute({
        path: '/p/p',
        component: components.Foo,
        name: 'pp',
      })
      await router.push('/p/p')
      remove()
      await router.push('/p/p')
      expect(router.currentRoute.value).toMatchObject({
        name: 'Param',
      })
    })
  })
})
