import fakePromise from 'faked-promise'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from '../src'
import { NavigationFailureType } from '../src/errors'
import { createDom, components, tick, nextNavigation } from './utils'
import {
  RouteRecordRaw,
  RouteLocationRaw,
  START_LOCATION_NORMALIZED,
} from '../src/types'
import { mockWarn } from 'jest-mock-warn'

declare var __DEV__: boolean

const routes: RouteRecordRaw[] = [
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
  { path: '/to-foo-query', redirect: '/foo?a=2#b' },
  { path: '/to-p/:p', redirect: { name: 'Param' } },
  { path: '/p/:p', name: 'Param', component: components.Bar },
  { path: '/optional/:p?', name: 'optional', component: components.Bar },
  { path: '/repeat/:r+', name: 'repeat', component: components.Bar },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  { path: '/redirect-with-param/:p', redirect: () => `/` },
  { path: '/before-leave', component: components.BeforeLeave },
  {
    path: '/parent',
    meta: { fromParent: 'foo' },
    component: components.Foo,
    children: [
      { path: 'child', meta: { fromChild: 'bar' }, component: components.Foo },
    ],
  },
  {
    path: '/inc-query-hash',
    redirect: to => ({
      name: 'Foo',
      query: { n: to.query.n + '-2' },
      hash: to.hash + '-2',
    }),
  },
  {
    path: '/basic',
    alias: '/basic-alias',
    component: components.Foo,
  },
  {
    path: '/aliases',
    alias: ['/aliases1', '/aliases2'],
    component: components.Nested,
    children: [
      {
        path: 'one',
        alias: ['o', 'o2'],
        component: components.Foo,
        children: [
          { path: 'two', alias: ['t', 't2'], component: components.Bar },
        ],
      },
    ],
  },
  { path: '/:pathMatch(.*)', component: components.Home, name: 'catch-all' },
]

async function newRouter(
  options: Partial<Parameters<typeof createRouter>[0]> = {}
) {
  const history = options.history || createMemoryHistory()
  const router = createRouter({ history, routes, ...options })
  await router.push('/')

  return { history, router }
}

describe('Router', () => {
  mockWarn()

  beforeAll(() => {
    createDom()
  })

  it('fails if history option is missing', () => {
    // @ts-expect-error
    expect(() => createRouter({ routes })).toThrowError(
      'Provide the "history" option'
    )
  })

  it('starts at START_LOCATION', () => {
    const history = createMemoryHistory()
    const router = createRouter({ history, routes })
    expect(router.currentRoute.value).toEqual(START_LOCATION_NORMALIZED)
  })

  it('calls history.push with router.push', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'push')
    await router.push('/foo')
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push).toHaveBeenCalledWith('/foo', undefined)
  })

  it('calls history.replace with router.replace', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    jest.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('parses query and hash with router.replace', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    jest.spyOn(history, 'replace')
    await router.replace('/foo?q=2#a')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith(
      '/foo?q=2#a',
      expect.anything()
    )
  })

  it('replaces if a guard redirects', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    // move somewhere else
    await router.push('/search')
    jest.spyOn(history, 'replace')
    jest.spyOn(history, 'push')
    await router.replace('/home-before')
    expect(history.push).toHaveBeenCalledTimes(0)
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/', expect.anything())
  })

  it('replaces if a guard redirect replaces', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    // move somewhere else
    router.beforeEach(to => {
      if (to.name !== 'Foo') {
        return { name: 'Foo', replace: true }
      }
      return // no warn
    })
    jest.spyOn(history, 'replace')
    jest.spyOn(history, 'push')
    await router.push('/search')
    expect(history.location).toBe('/foo')
    expect(history.push).toHaveBeenCalledTimes(0)
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('allows to customize parseQuery', async () => {
    const parseQuery = jest.fn(_ => ({}))
    const { router } = await newRouter({ parseQuery })
    const to = router.resolve('/foo?bar=baz')
    expect(parseQuery).toHaveBeenCalledWith('bar=baz')
    expect(to.query).toEqual({})
  })

  it('allows to customize stringifyQuery', async () => {
    const stringifyQuery = jest.fn(_ => '')
    const { router } = await newRouter({ stringifyQuery })
    const to = router.resolve({ query: { foo: 'bar' } })
    expect(stringifyQuery).toHaveBeenCalledWith({ foo: 'bar' })
    expect(to.query).toEqual({ foo: 'bar' })
    expect(to.fullPath).toBe('/')
  })

  it('creates an empty query with no query', async () => {
    const stringifyQuery = jest.fn(_ => '')
    const { router } = await newRouter({ stringifyQuery })
    const to = router.resolve({ hash: '#a' })
    expect(stringifyQuery).not.toHaveBeenCalled()
    expect(to.query).toEqual({})
  })

  it('merges meta properties from parent to child', async () => {
    const { router } = await newRouter()
    expect(router.resolve('/parent')).toMatchObject({
      meta: { fromParent: 'foo' },
    })
    expect(router.resolve('/parent/child')).toMatchObject({
      meta: { fromParent: 'foo', fromChild: 'bar' },
    })
  })

  it('merges meta properties from component-less route records', async () => {
    const { router } = await newRouter()
    router.addRoute({
      meta: { parent: true },
      path: '/app',
      children: [
        { path: '', component: components.Foo, meta: { child: true } },
        {
          path: 'nested',
          component: components.Foo,
          children: [
            { path: 'a', children: [{ path: 'b', component: components.Foo }] },
          ],
        },
      ],
    })
    expect(router.resolve('/app')).toMatchObject({
      meta: { parent: true, child: true },
    })
    expect(router.resolve('/app/nested/a/b')).toMatchObject({
      meta: { parent: true },
    })
  })

  it('can do initial navigation to /', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: components.Home }],
    })
    expect(router.currentRoute.value).toBe(START_LOCATION_NORMALIZED)
    await router.push('/')
    expect(router.currentRoute.value).not.toBe(START_LOCATION_NORMALIZED)
  })

  it('resolves hash history as a relative hash link', async () => {
    let history = createWebHashHistory()
    let { router } = await newRouter({ history })
    expect(router.resolve('/foo?bar=baz#hey')).toMatchObject({
      fullPath: '/foo?bar=baz#hey',
      href: '#/foo?bar=baz#hey',
    })
    history = createWebHashHistory('/with/base/')
    ;({ router } = await newRouter({ history }))
    expect(router.resolve('/foo?bar=baz#hey')).toMatchObject({
      fullPath: '/foo?bar=baz#hey',
      href: '#/foo?bar=baz#hey',
    })
  })

  it('can pass replace option to push', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'replace')
    await router.push({ path: '/foo', replace: true })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('can replaces current location with a string location', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('can replaces current location with an object location', async () => {
    const { router, history } = await newRouter()
    jest.spyOn(history, 'replace')
    await router.replace({ path: '/foo' })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('navigates if the location does not exist', async () => {
    const { router } = await newRouter({ routes: [routes[0]] })
    const spy = jest.fn((to, from, next) => next())
    router.beforeEach(spy)
    await router.push('/idontexist')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value).toMatchObject({ matched: [] })
    spy.mockClear()
    await router.push('/me-neither')
    expect(router.currentRoute.value).toMatchObject({ matched: [] })
    expect(spy).toHaveBeenCalledTimes(1)
    expect('No match found').toHaveBeenWarnedTimes(2)
  })

  it('casts number params to string', async () => {
    const { router } = await newRouter()
    await router.push({ name: 'Param', params: { p: 0 } })
    expect(router.currentRoute.value).toMatchObject({ params: { p: '0' } })
  })

  it('removes null/undefined params', async () => {
    const { router } = await newRouter()

    const route1 = router.resolve({
      name: 'optional',
      params: { p: undefined },
    })
    expect(route1.path).toBe('/optional')
    expect(route1.params).toEqual({})

    const route2 = router.resolve({
      name: 'optional',
      params: { p: null },
    })
    expect(route2.path).toBe('/optional')
    expect(route2.params).toEqual({})

    await router.push({ name: 'optional', params: { p: null } })
    expect(router.currentRoute.value.params).toEqual({})
    await router.push({ name: 'optional', params: {} })
  })

  it('removes null/undefined optional params when current location has it', async () => {
    const { router } = await newRouter()

    await router.push({ name: 'optional', params: { p: 'a' } })
    await router.push({ name: 'optional', params: { p: null } })
    expect(router.currentRoute.value.params).toEqual({})

    await router.push({ name: 'optional', params: { p: 'a' } })
    await router.push({ name: 'optional', params: { p: undefined } })
    expect(router.currentRoute.value.params).toEqual({})
  })

  it('keeps empty strings in optional params', async () => {
    const { router } = await newRouter()
    const route1 = router.resolve({ name: 'optional', params: { p: '' } })
    expect(route1.params).toEqual({ p: '' })
  })

  it('navigates to same route record but different query', async () => {
    const { router } = await newRouter()
    await router.push('/?q=1')
    expect(router.currentRoute.value.query).toEqual({ q: '1' })
    await router.push('/?q=2')
    expect(router.currentRoute.value.query).toEqual({ q: '2' })
  })

  it('navigates to same route record but different hash', async () => {
    const { router } = await newRouter()
    await router.push('/#one')
    expect(router.currentRoute.value.hash).toBe('#one')
    await router.push('/#two')
    expect(router.currentRoute.value.hash).toBe('#two')
  })

  it('fails if required params are missing', async () => {
    const { router } = await newRouter()
    expect(() => router.resolve({ name: 'Param', params: {} })).toThrowError(
      /missing required param "p"/i
    )
    expect(() =>
      router.resolve({ name: 'Param', params: { p: 'po' } })
    ).not.toThrow()
  })

  it('fails if required repeated params are missing', async () => {
    const { router } = await newRouter()
    expect(() => router.resolve({ name: 'repeat', params: {} })).toThrowError(
      /missing required param "r"/i
    )
    expect(() =>
      router.resolve({ name: 'repeat', params: { r: [] } })
    ).toThrowError(/missing required param "r"/i)
    expect(() =>
      router.resolve({ name: 'repeat', params: { r: ['a'] } })
    ).not.toThrow()
  })

  it('fails with arrays for non repeatable params', async () => {
    const { router } = await newRouter()
    router.addRoute({ path: '/r1/:r', name: 'r1', component: components.Bar })
    router.addRoute({ path: '/r2/:r?', name: 'r2', component: components.Bar })
    expect(() =>
      router.resolve({ name: 'r1', params: { r: [] } })
    ).toThrowError(/"r" is an array but it is not repeatable/i)
    expect(() =>
      router.resolve({ name: 'r2', params: { r: [] } })
    ).toThrowError(/"r" is an array but it is not repeatable/i)
    expect(() =>
      router.resolve({ name: 'r1', params: { r: 'a' } })
    ).not.toThrow()
  })

  it('does not fail for optional params', async () => {
    const { router } = await newRouter()
    router.addRoute({ path: '/r1/:r*', name: 'r1', component: components.Bar })
    router.addRoute({ path: '/r2/:r?', name: 'r2', component: components.Bar })
    expect(() => router.resolve({ name: 'r1', params: {} })).not.toThrow()
    expect(() => router.resolve({ name: 'r2', params: {} })).not.toThrow()
  })

  it('can redirect to a star route when encoding the param', () => {
    const history = createMemoryHistory()
    const router = createRouter({
      history,
      routes: [
        { name: 'notfound', path: '/:path(.*)+', component: components.Home },
      ],
    })
    let path = 'not/found%2Fha'
    let href = '/' + path
    expect(router.resolve(href)).toMatchObject({
      name: 'notfound',
      fullPath: href,
      path: href,
      href: href,
    })
    expect(
      router.resolve({
        name: 'notfound',
        params: {
          path: path
            .split('/')
            // we need to provide the value unencoded
            .map(segment => segment.replace('%2F', '/')),
        },
      })
    ).toMatchObject({
      name: 'notfound',
      fullPath: href,
      path: href,
      href: href,
    })
  })

  it('can pass a currentLocation to resolve', async () => {
    const { router } = await newRouter()
    expect(router.resolve({ params: { p: 1 } })).toMatchObject({
      path: '/',
    })
    expect(
      router.resolve(
        { params: { p: 1 } },
        router.resolve({ name: 'Param', params: { p: 2 } })
      )
    ).toMatchObject({
      name: 'Param',
      params: { p: '1' },
    })
  })

  it('resolves relative locations', async () => {
    const { router } = await newRouter()
    await router.push('/users/posva')
    await router.push('add')
    expect(router.currentRoute.value.path).toBe('/users/add')
    await router.push('/users/posva')
    await router.push('./add')
    expect(router.currentRoute.value.path).toBe('/users/add')
  })

  it('resolves parent relative locations', async () => {
    const { router } = await newRouter()
    await router.push('/users/posva')
    await router.push('../add')
    expect(router.currentRoute.value.path).toBe('/add')
    await router.push('/users/posva')
    await router.push('../../../add')
    expect(router.currentRoute.value.path).toBe('/add')
    await router.push('/users/posva')
    await router.push('../')
    expect(router.currentRoute.value.path).toBe('/')
  })

  describe('alias', () => {
    it('does not navigate to alias if already on original record', async () => {
      const { router } = await newRouter()
      const spy = jest.fn((to, from, next) => next())
      await router.push('/basic')
      router.beforeEach(spy)
      await router.push('/basic-alias')
      expect(spy).not.toHaveBeenCalled()
    })

    it('does not navigate to alias with children if already on original record', async () => {
      const { router } = await newRouter()
      const spy = jest.fn((to, from, next) => next())
      await router.push('/aliases')
      router.beforeEach(spy)
      await router.push('/aliases1')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2')
      expect(spy).not.toHaveBeenCalled()
    })

    it('does not navigate to child alias if already on original record', async () => {
      const { router } = await newRouter()
      const spy = jest.fn((to, from, next) => next())
      await router.push('/aliases/one')
      router.beforeEach(spy)
      await router.push('/aliases1/one')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2/one')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2/o')
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('navigation cancelled', () => {
    async function checkNavigationCancelledOnPush(
      target?: RouteLocationRaw | false
    ) {
      const [p1, r1] = fakePromise()
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      router.beforeEach(async (to, from, next) => {
        if (to.name !== 'Param') return next()
        // the first navigation gets passed target
        if (to.params.p === 'a') {
          await p1
          target ? next(target) : next()
        } else {
          // the second one just passes
          next()
        }
      })
      const from = router.currentRoute.value
      const pA = router.push('/p/a')
      // we resolve the second navigation first then the first one
      // and the first navigation should be ignored because at that time
      // the second one will have already been resolved
      await expect(router.push('/p/b')).resolves.toEqual(undefined)
      expect(router.currentRoute.value.fullPath).toBe('/p/b')
      r1()
      await expect(pA).resolves.toEqual(
        expect.objectContaining({
          to: expect.objectContaining({ path: '/p/a' }),
          from,
          type: NavigationFailureType.cancelled,
        })
      )
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
      target?: RouteLocationRaw | false
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
      history.go(-1)
      history.go(-1)

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

  describe('redirect', () => {
    it('handles one redirect from route record', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-foo')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    it('only triggers guards once with a redirect option', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      const spy = jest.fn((to, from, next) => next())
      router.beforeEach(spy)
      await router.push('/to-foo')
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/foo' }),
        expect.objectContaining({ path: '/' }),
        expect.any(Function)
      )
    })

    it('handles a double redirect from route record', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-foo2')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo2',
      })
    })

    it('handles query and hash passed in redirect string', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-foo-query')).resolves.toEqual(undefined)
      expect(router.currentRoute.value).toMatchObject({
        name: 'Foo',
        path: '/foo',
        params: {},
        query: { a: '2' },
        hash: '#b',
        redirectedFrom: expect.objectContaining({
          fullPath: '/to-foo-query',
        }),
      })
    })

    it('keeps query and hash when redirect is a string', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-foo?hey=foo#fa')).resolves.toEqual(
        undefined
      )
      expect(router.currentRoute.value).toMatchObject({
        name: 'Foo',
        path: '/foo',
        params: {},
        query: { hey: 'foo' },
        hash: '#fa',
        redirectedFrom: expect.objectContaining({
          fullPath: '/to-foo?hey=foo#fa',
        }),
      })
    })

    it('keeps params, query and hash from targetLocation on redirect', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-p/1?hey=foo#fa')).resolves.toEqual(
        undefined
      )
      expect(router.currentRoute.value).toMatchObject({
        name: 'Param',
        params: { p: '1' },
        query: { hey: 'foo' },
        hash: '#fa',
        redirectedFrom: expect.objectContaining({
          fullPath: '/to-p/1?hey=foo#fa',
        }),
      })
    })

    it('discard params on string redirect', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/redirect-with-param/test')).resolves.toEqual(
        undefined
      )
      expect(router.currentRoute.value).toMatchObject({
        params: {},
        query: {},
        hash: '',
        redirectedFrom: expect.objectContaining({
          fullPath: '/redirect-with-param/test',
          params: { p: 'test' },
        }),
      })
    })

    it('allows object in redirect', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await expect(router.push('/to-foo-named')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo-named',
      })
    })

    it('keeps original replace if redirect', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await router.push('/search')

      await expect(router.replace('/to-foo')).resolves.toEqual(undefined)
      expect(router.currentRoute.value).toMatchObject({
        path: '/foo',
        redirectedFrom: expect.objectContaining({ path: '/to-foo' }),
      })

      history.go(-1)
      await nextNavigation(router)
      expect(router.currentRoute.value).not.toMatchObject({
        path: '/search',
      })
    })

    it('can pass on query and hash when redirecting', async () => {
      const history = createMemoryHistory()
      const router = createRouter({ history, routes })
      await router.push('/inc-query-hash?n=3#fa')
      const loc = router.currentRoute.value
      expect(loc).toMatchObject({
        name: 'Foo',
        query: {
          n: '3-2',
        },
        hash: '#fa-2',
      })
      expect(loc.redirectedFrom).toMatchObject({
        fullPath: '/inc-query-hash?n=3#fa',
        query: { n: '3' },
        hash: '#fa',
        path: '/inc-query-hash',
      })
    })

    it('allows a redirect with children', async () => {
      const history = createMemoryHistory()
      const router = createRouter({
        history,
        routes: [
          {
            path: '/parent',
            redirect: { name: 'child' },
            component: components.Home,
            name: 'parent',
            children: [{ name: 'child', path: '', component: components.Home }],
          },
        ],
      })
      await expect(router.push({ name: 'parent' })).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('child')
      expect(loc.path).toBe('/parent')
      expect(loc.redirectedFrom).toMatchObject({
        name: 'parent',
        path: '/parent',
      })
    })

    // https://github.com/vuejs/router/issues/404
    it('works with named routes', async () => {
      const history = createMemoryHistory()
      const router = createRouter({
        history,
        routes: [
          { name: 'foo', path: '/foo', redirect: '/bar' },
          { path: '/bar', component: components.Bar },
        ],
      })
      await expect(router.push('/foo')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe(undefined)
      expect(loc.path).toBe('/bar')
      expect(loc.redirectedFrom).toMatchObject({
        name: 'foo',
        path: '/foo',
      })
    })
  })

  describe('base', () => {
    it('allows base option in abstract history', async () => {
      const history = createMemoryHistory('/app/')
      const router = createRouter({ history, routes })
      expect(router.currentRoute.value).toMatchObject({
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
      expect(router.currentRoute.value).toMatchObject({
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
  })

  describe('Dynamic Routing', () => {
    it('resolves new added routes', async () => {
      const { router } = await newRouter({ routes: [] })
      expect(router.resolve('/new-route')).toMatchObject({
        name: undefined,
        matched: [],
      })
      expect('No match found').toHaveBeenWarned()
      router.addRoute({
        path: '/new-route',
        component: components.Foo,
        name: 'new route',
      })
      expect(router.resolve('/new-route')).toMatchObject({
        name: 'new route',
      })
    })

    it('checks if a route exists', async () => {
      const { router } = await newRouter()
      router.addRoute({
        name: 'new-route',
        path: '/new-route',
        component: components.Foo,
      })
      expect(router.hasRoute('new-route')).toBe(true)
      expect(router.hasRoute('no')).toBe(false)
      router.removeRoute('new-route')
      expect(router.hasRoute('new-route')).toBe(false)
    })

    it('can redirect to children in the middle of navigation', async () => {
      const { router } = await newRouter({ routes: [] })
      expect(router.resolve('/new-route')).toMatchObject({
        name: undefined,
        matched: [],
      })
      expect('No match found').toHaveBeenWarned()
      let removeRoute: (() => void) | undefined
      router.addRoute({
        path: '/dynamic',
        component: components.Nested,
        name: 'dynamic parent',
        end: false,
        strict: true,
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
      const { router } = await newRouter({ routes: [] })
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
      expect('No match found').toHaveBeenWarned()
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
      const { router } = await newRouter({
        routes: [routes.find(route => route.name === 'Foo')!],
      })
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
      expect('No match found').toHaveBeenWarned()
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
