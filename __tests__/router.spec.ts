import fakePromise from 'faked-promise'
import { Router, createMemoryHistory, createHistory } from '../src'
import { NavigationCancelled } from '../src/errors'
import { createDom, components, tick } from './utils'
import { RouteRecord, RouteLocation } from '../src/types'

const routes: RouteRecord[] = [
  { path: '/', component: components.Home },
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

describe('Router', () => {
  beforeAll(() => {
    createDom()
  })

  it('can be instantiated', () => {
    const history = createMemoryHistory()
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      name: undefined,
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
      meta: {},
    })
  })

  // TODO: should do other checks not based on history implem
  it.skip('takes browser location', () => {
    const history = createMemoryHistory()
    history.replace('/search?q=dog#footer')
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      fullPath: '/search?q=dog#footer',
      hash: '#footer',
      params: {},
      path: '/search',
      query: { q: 'dog' },
    })
  })

  it('calls history.push with router.push', async () => {
    const history = createMemoryHistory()
    const router = new Router({ history, routes })
    jest.spyOn(history, 'push')
    await router.push('/foo')
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push).toHaveBeenCalledWith({
      fullPath: '/foo',
      path: '/foo',
      query: {},
      hash: '',
    })
  })

  it('calls history.replace with router.replace', async () => {
    const history = createMemoryHistory()
    const router = new Router({ history, routes })
    jest.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith({
      fullPath: '/foo',
      path: '/foo',
      query: {},
      hash: '',
    })
  })

  it('can pass replace option to push', async () => {
    const history = createMemoryHistory()
    const router = new Router({ history, routes })
    jest.spyOn(history, 'replace')
    await router.push({ path: '/foo', replace: true })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith({
      fullPath: '/foo',
      path: '/foo',
      query: {},
      hash: '',
    })
  })

  describe('navigation', () => {
    async function checkNavigationCancelledOnPush(
      target?: RouteLocation | false | ((vm: any) => void)
    ) {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
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
      expect(router.currentRoute.fullPath).toBe('/p/b')
      r1()
      try {
        await pA
      } catch (err) {
        expect(err).toBeInstanceOf(NavigationCancelled)
      }
      expect(router.currentRoute.fullPath).toBe('/p/b')
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
      const router = new Router({ history, routes })
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

      expect(router.currentRoute.fullPath).toBe('/p/b')
      // resolves the last call to history.back() first
      // so we end up on /p/initial
      r1()
      await tick()
      expect(router.currentRoute.fullPath).toBe('/foo')
      // resolves the pending navigation, this should be cancelled
      r2()
      await tick()
      expect(router.currentRoute.fullPath).toBe('/foo')
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

  describe('matcher', () => {
    it('handles one redirect from route record', async () => {
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    it('drops query and params on redirect if not provided', async () => {
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo?hey=foo#fa')
      expect(loc.name).toBe('Foo')
      expect(loc.query).toEqual({})
      expect(loc.hash).toBe('')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    it('allows object in redirect', async () => {
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo-named')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo-named',
      })
    })

    it('can pass on query and hash when redirecting', async () => {
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
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

    it('handles multiple redirect fields in route record', async () => {
      const history = createMemoryHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo2')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
        redirectedFrom: {
          path: '/to-foo2',
        },
      })
    })
  })

  it('allows base option in abstract history', async () => {
    const history = createMemoryHistory('/app/')
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      name: undefined,
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
      meta: {},
    })
    await router.replace('/foo')
    expect(router.currentRoute).toMatchObject({
      name: 'Foo',
      fullPath: '/foo',
      hash: '',
      params: {},
      path: '/foo',
      query: {},
    })
  })

  it('allows base option with html5 history', async () => {
    const history = createHistory('/app/')
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      name: undefined,
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
      meta: {},
    })
    await router.replace('/foo')
    expect(router.currentRoute).toMatchObject({
      name: 'Foo',
      fullPath: '/foo',
      hash: '',
      params: {},
      path: '/foo',
      query: {},
    })
  })

  // it('redirects with route record redirect')
})
