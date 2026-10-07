/**
 * @vitest-environment happy-dom
 */
/**
 * Port of `__tests__/router.spec.ts` to `experimental_createRouter()` with
 * `createDynamicResolver()`. It uses the same classic `routes` array to check
 * how apps that use `createRouter({ routes })` migrate.
 */
import fakePromise from 'faked-promise'
import { computed, effectScope } from 'vue'
import {
  experimental_createRouter,
  createDynamicResolver,
  createFixedResolver,
  normalizeRouteRecord,
  MatcherPatternPathStatic,
  type EXPERIMENTAL_RouterOptions,
} from './index'
import type { RouteLocationRaw } from '../typed-routes'
import type { RouteRecordRaw } from '../types'
import { createMemoryHistory } from '../history/memory'
import { createWebHistory } from '../history/html5'
import { createWebHashHistory } from '../history/hash'
import { loadRouteLocation } from '../navigationGuards'
import { NavigationFailureType } from '../errors'
import { components, tick, nextNavigation } from '../../__tests__/utils'
import { START_LOCATION_NORMALIZED } from '../location'
import { NO_MATCH_LOCATION } from './route-resolver/resolver-abstract'
import {
  vi,
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest'
import type { MockInstance } from 'vitest'
import { mockWarn } from '../../__tests__/vitest-mock-warn'

// same routes as __tests__/router.spec.ts
const routes: RouteRecordRaw[] = [
  { path: '/', component: components.Home, name: 'home' },
  { path: '/home', redirect: '/' },
  {
    path: '/home-before',
    component: components.Home,
    beforeEnter: (_to, _from) => {
      return '/'
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

type NewRouterOptions = Partial<
  Omit<EXPERIMENTAL_RouterOptions, 'resolver'>
> & { routes?: RouteRecordRaw[] }

function createRouterWithRoutes({
  routes: rawRoutes = routes,
  ...options
}: NewRouterOptions = {}) {
  const history = options.history || createMemoryHistory()
  const router = experimental_createRouter({
    ...options,
    history,
    resolver: createDynamicResolver(rawRoutes),
  })
  // `/home-before` uses the deprecated `beforeEnter`
  if (rawRoutes.some(route => route.beforeEnter)) {
    expect('VUE_ROUTER_D0001').toHaveBeenWarned()
  }
  return { history, router }
}

async function newRouter(options: NewRouterOptions = {}) {
  const result = createRouterWithRoutes(options)
  await result.router.push('/')
  return result
}

describe('Experimental Router with createDynamicResolver()', () => {
  mockWarn()

  // migration gap: the experimental router does not check the `history` option
  it.skip('fails if history option is missing', () => {})

  // adapted from "uses a matcher passed in options": there is no `matcher`
  // option, the resolver is shared instead
  it('can share a resolver between routers', () => {
    const resolver = createDynamicResolver([
      { path: '/shared', component: components.Foo, name: 'shared' },
    ])
    const router = experimental_createRouter({
      history: createMemoryHistory(),
      resolver,
    })
    expect(router.resolve('/shared').name).toBe('shared')
    expect(router.hasRoute('shared')).toBe(true)

    const otherRouter = experimental_createRouter({
      history: createMemoryHistory(),
      resolver,
    })
    expect(otherRouter.resolve('/shared').matched).toEqual(
      router.resolve('/shared').matched
    )
    router.addRoute({
      path: '/other',
      name: 'other',
      component: components.Foo,
    })
    expect(otherRouter.hasRoute('other')).toBe(true)
  })

  it('starts at START_LOCATION', () => {
    const { router } = createRouterWithRoutes()
    expect(router.currentRoute.value).toEqual(START_LOCATION_NORMALIZED)
  })

  it('calls history.push with router.push', async () => {
    const { router, history } = await newRouter()
    vi.spyOn(history, 'push')
    await router.push('/foo')
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push).toHaveBeenCalledWith('/foo', undefined)
  })

  it('calls history.replace with router.replace', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    vi.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('parses query and hash with router.replace', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    vi.spyOn(history, 'replace')
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
    await router.push('/search')
    vi.spyOn(history, 'replace')
    vi.spyOn(history, 'push')
    router.beforeEach(to => {
      if (to.fullPath !== '/') return '/'
      return
    })
    await router.replace('/home-before')
    expect(history.push).toHaveBeenCalledTimes(0)
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/', expect.anything())
  })

  it('replaces if a guard redirect replaces', async () => {
    const history = createMemoryHistory()
    const { router } = await newRouter({ history })
    router.beforeEach(to => {
      if (to.name !== 'Foo') {
        return { name: 'Foo', replace: true }
      }
      return
    })
    vi.spyOn(history, 'replace')
    vi.spyOn(history, 'push')
    await router.push('/search')
    expect(history.location).toBe('/foo')
    expect(history.push).toHaveBeenCalledTimes(0)
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  // migration gap: the experimental router ignores the `parseQuery` option
  it.skip('allows to customize parseQuery', async () => {})

  // migration gap: the experimental resolver always uses the default
  // `stringifyQuery()`, the router option is not used to build `fullPath`
  it.skip('allows to customize stringifyQuery', async () => {})

  it('creates an empty query with no query', async () => {
    const stringifyQuery = vi.fn(_ => '')
    const { router } = await newRouter({ stringifyQuery })
    const to = router.resolve({ hash: '#a' }, router.currentRoute.value)
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
    const { router } = createRouterWithRoutes({
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
    vi.spyOn(history, 'replace')
    await router.push({ path: '/foo', replace: true })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('can replaces current location with a string location', async () => {
    const { router, history } = await newRouter()
    vi.spyOn(history, 'replace')
    await router.replace('/foo')
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('can replaces current location with an object location', async () => {
    const { router, history } = await newRouter()
    vi.spyOn(history, 'replace')
    await router.replace({ path: '/foo' })
    expect(history.replace).toHaveBeenCalledTimes(1)
    expect(history.replace).toHaveBeenCalledWith('/foo', expect.anything())
  })

  it('navigates if the location does not exist', async () => {
    const { router } = await newRouter({ routes: [routes[0]] })
    const spy = vi.fn((_to, _from) => {})
    router.beforeEach(spy)
    await router.push('/idontexist')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value).toMatchObject({
      name: NO_MATCH_LOCATION.name,
      matched: [],
    })
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

  // missing optional params are `null`
  it('removes null/undefined params', async () => {
    const { router } = await newRouter()

    const route1 = router.resolve({
      name: 'optional',
      params: { p: undefined },
    })
    expect(route1.path).toBe('/optional')
    expect(route1.params).toEqual({ p: null })

    const route2 = router.resolve({
      name: 'optional',
      params: { p: null },
    })
    expect(route2.path).toBe('/optional')
    expect(route2.params).toEqual({ p: null })

    await router.push({ name: 'optional', params: { p: null } })
    expect(router.currentRoute.value.params).toEqual({ p: null })
    await router.push({ name: 'optional', params: {} })
    expect(router.currentRoute.value.params).toEqual({ p: null })
  })

  // relative object locations need an explicit current location, and params
  // are only kept if the current route has them
  it('handles undefined path in relative navigations', async () => {
    const { router } = await newRouter()
    await router.push({ name: 'Param', params: { p: 'a' } })

    const route1 = router.resolve(
      { path: undefined, params: { p: 'b' } },
      router.currentRoute.value
    )
    expect(route1.path).toBe('/p/b')
    expect(route1.params).toEqual({ p: 'b' })
  })

  // migration gap: `router.resolve(undefined | null)` throws a TypeError
  // ("Cannot read properties of undefined (reading 'query')") instead of
  // warning and resolving to "/"
  it.skip('warns on undefined location during dev', async () => {})
  it.skip('warns on null location during dev', async () => {})

  it('removes null/undefined optional params when current location has it', async () => {
    const { router } = await newRouter()

    await router.push({ name: 'optional', params: { p: 'a' } })
    await router.push({ name: 'optional', params: { p: null } })
    expect(router.currentRoute.value.params).toEqual({ p: null })

    await router.push({ name: 'optional', params: { p: 'a' } })
    await router.push({ name: 'optional', params: { p: undefined } })
    expect(router.currentRoute.value.params).toEqual({ p: null })
  })

  // empty optional params are `null`
  it('turns empty strings in optional params into null', async () => {
    const { router } = await newRouter()
    const route1 = router.resolve({ name: 'optional', params: { p: '' } })
    expect(route1.params).toEqual({ p: null })
    expect(route1.path).toBe('/optional')
  })

  it('navigates to same route record but different query', async () => {
    const { router } = await newRouter()
    await router.push('/?q=1')
    // query values are always arrays
    expect(router.currentRoute.value.query).toEqual({ q: ['1'] })
    await router.push('/?q=2')
    expect(router.currentRoute.value.query).toEqual({ q: ['2'] })
  })

  it('navigates to same route record but different hash', async () => {
    const { router } = await newRouter()
    await router.push('/#one')
    expect(router.currentRoute.value.hash).toBe('#one')
    await router.push('/#two')
    expect(router.currentRoute.value.hash).toBe('#two')
  })

  // the experimental router never decodes the hash
  it('never decodes nor double-encodes a percent-encoded hash', async () => {
    const { router } = await newRouter()
    await router.push({ path: '/', hash: '#%26' })
    expect(router.currentRoute.value.hash).toBe('#%26')
    expect(router.currentRoute.value.fullPath).toBe('/#%26')
    await router.push('/#%2526')
    expect(router.currentRoute.value.hash).toBe('#%2526')
    expect(router.currentRoute.value.fullPath).toBe('/#%2526')
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
    // repeatable params are always arrays
    expect(router.resolve({ name: 'r1', params: {} }).params).toEqual({
      r: [],
    })
    expect(router.resolve({ name: 'r2', params: {} }).params).toEqual({
      r: null,
    })
  })

  it('resolves optional and repeatable params from a path', async () => {
    const { router } = await newRouter()
    expect(router.resolve('/optional')).toMatchObject({
      name: 'optional',
      params: { p: null },
    })
    expect(router.resolve('/optional/a')).toMatchObject({
      name: 'optional',
      params: { p: 'a' },
    })
    expect(router.resolve('/repeat/a')).toMatchObject({
      name: 'repeat',
      params: { r: ['a'] },
    })
    expect(router.resolve('/repeat/a/b')).toMatchObject({
      name: 'repeat',
      params: { r: ['a', 'b'] },
    })
    await router.push({ name: 'repeat', params: { r: ['a', 'b'] } })
    expect(router.currentRoute.value).toMatchObject({
      path: '/repeat/a/b',
      params: { r: ['a', 'b'] },
    })
  })

  it('resolves the catch-all route', async () => {
    const { router } = await newRouter()
    await router.push('/some/unknown/path')
    expect(router.currentRoute.value).toMatchObject({
      name: 'catch-all',
      path: '/some/unknown/path',
      params: { pathMatch: 'some/unknown/path' },
    })
    expect(
      router.resolve({
        name: 'catch-all',
        params: { pathMatch: 'a/b' },
      })
      // like the classic router, slashes are encoded in non repeatable params
    ).toMatchObject({ path: '/a%2Fb', params: { pathMatch: 'a/b' } })
  })

  it('can redirect to a star route when encoding the param', () => {
    const { router } = createRouterWithRoutes({
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
    expect(
      router.resolve({ params: { p: 1 } }, router.currentRoute.value)
    ).toMatchObject({
      path: '/',
    })
    expect(
      router.resolve(
        { params: { p: 1 } },
        await loadRouteLocation(
          router.resolve({ name: 'Param', params: { p: 2 } })
        )
      )
    ).toMatchObject({
      name: 'Param',
      params: { p: '1' },
    })
  })

  it('resolves a relative location against a passed currentLocation', async () => {
    const { router } = await newRouter()
    const current = await loadRouteLocation(router.resolve('/parent/child'))
    expect(router.resolve('child', current).path).toBe('/parent/child')
    await router.push('/foo')
    expect(router.resolve('child', current).path).toBe('/parent/child')
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

  it('gives a generated Symbol name to unnamed records', async () => {
    const { router } = await newRouter()
    const location = router.resolve('/search')
    expect(typeof location.name).toBe('symbol')
    expect(router.resolve('/search').name).toBe(location.name)
    expect(router.hasRoute(location.name!)).toBe(true)
  })

  describe('alias', () => {
    it('navigates to alias', async () => {
      const { router } = await newRouter()
      await router.push('/basic-alias')
      const original = router.resolve('/basic').matched[0]
      expect(router.currentRoute.value.path).toBe('/basic-alias')
      expect(router.currentRoute.value.name).toBe(original.name)
      expect(router.currentRoute.value.matched[0].aliasOf).toBe(original)
    })

    it('navigates to nested aliases', async () => {
      const { router } = await newRouter()
      for (const path of [
        '/aliases1/o/t',
        '/aliases2/one/t2',
        '/aliases/o2/two',
      ]) {
        const location = router.resolve(path)
        expect(location.path).toBe(path)
        expect(location.matched).toHaveLength(3)
        expect(location.matched.map(r => r.components?.default)).toEqual([
          components.Nested,
          components.Foo,
          components.Bar,
        ])
      }
    })

    it('does not navigate to alias if already on original record', async () => {
      const { router } = await newRouter()
      const spy = vi.fn((_to, _from) => {})
      await router.push('/basic')
      router.beforeEach(spy)
      await router.push('/basic-alias')
      expect(spy).not.toHaveBeenCalled()
    })

    it('does not navigate to alias with children if already on original record', async () => {
      const { router } = await newRouter()
      const spy = vi.fn((_to, _from) => {})
      await router.push('/aliases')
      router.beforeEach(spy)
      await router.push('/aliases1')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2')
      expect(spy).not.toHaveBeenCalled()
    })

    it('does not navigate to child alias if already on original record', async () => {
      const { router } = await newRouter()
      const spy = vi.fn((_to, _from) => {})
      await router.push('/aliases/one')
      router.beforeEach(spy)
      await router.push('/aliases1/one')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2/one')
      expect(spy).not.toHaveBeenCalled()
      await router.push('/aliases2/o')
      expect(spy).not.toHaveBeenCalled()
    })

    it('removes the aliases with the original record', async () => {
      const { router } = await newRouter()
      const name = router.resolve('/basic').name!
      router.removeRoute(name)
      expect(router.resolve('/basic-alias').name).toBe('catch-all')
      expect(router.resolve('/basic').name).toBe('catch-all')
    })
  })

  describe('beforeEnter', () => {
    it('warns that beforeEnter is deprecated', () => {
      const resolver = createDynamicResolver([])
      experimental_createRouter({ history: createMemoryHistory(), resolver })
      resolver.addRoute({
        path: '/guarded',
        name: 'guarded',
        component: components.Foo,
        beforeEnter: () => {},
      })
      expect('VUE_ROUTER_D0001').toHaveBeenWarnedTimes(1)
    })

    it('still runs beforeEnter guards', async () => {
      const { router } = await newRouter()
      const spy = vi.fn()
      router.addRoute({
        path: '/guarded',
        name: 'guarded',
        component: components.Foo,
        beforeEnter: [spy, spy],
      })
      expect('VUE_ROUTER_D0001').toHaveBeenWarned()
      await router.push('/guarded')
      expect(spy).toHaveBeenCalledTimes(2)
      expect(router.currentRoute.value.name).toBe('guarded')
      // not called again when only the query changes
      await router.push('/guarded?a=1')
      expect(spy).toHaveBeenCalledTimes(2)
    })

    it('can redirect from beforeEnter', async () => {
      const { router } = await newRouter()
      await router.push('/foo')
      await router.push('/home-before')
      expect(router.currentRoute.value).toMatchObject({
        path: '/',
        name: 'home',
      })
    })
  })

  describe('navigation cancelled', () => {
    async function checkNavigationCancelledOnPush(
      target?: RouteLocationRaw | false
    ) {
      const [p1, r1] = fakePromise()
      const { router } = createRouterWithRoutes()
      router.beforeEach(async (to, _from) => {
        if (to.name !== 'Param') return
        if (to.params.p === 'a') {
          await p1
          return target || undefined
        } else {
          return
        }
      })
      const from = router.currentRoute.value
      const pA = router.push('/p/a')
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
      const { router, history } = createRouterWithRoutes()

      await router.push('/foo')
      await router.push('/p/a')
      await router.push('/p/b')

      router.beforeEach(async (to, from) => {
        if (to.name !== 'Param') return
        if (to.fullPath === '/foo') {
          await p1
          return
        } else if (from.fullPath === '/p/b') {
          await p2
          // @ts-ignore: same as function above
          return target
        } else {
          return
        }
      })

      history.go(-1)
      history.go(-1)

      expect(router.currentRoute.value.fullPath).toBe('/p/b')
      r1()
      await tick()
      expect(router.currentRoute.value.fullPath).toBe('/foo')
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

  describe('scrollBehavior', () => {
    let scrollTo: MockInstance

    beforeAll(() => {
      vi.useFakeTimers()
      scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    })

    beforeEach(() => {
      scrollTo.mockClear()
      window.history.replaceState(null, '', '/')
    })

    afterAll(() => {
      scrollTo.mockRestore()
      vi.useRealTimers()
    })

    const positions: Record<string, number> = {
      '/': 3000,
      '/foo': 1000,
      '/p/a': 2000,
    }

    it('does not restore scroll positions for pop navigations with unknown direction', async () => {
      const scrollBehavior = vi.fn()
      const { router } = await newRouter({
        history: createWebHashHistory(),
        scrollBehavior,
      })
      scrollBehavior.mockClear()

      function changeHash(hash: string) {
        window.location.hash = hash
        window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
      }

      changeHash('#/foo')
      await nextNavigation(router)
      changeHash('#/')
      await nextNavigation(router)

      expect(scrollBehavior).toHaveBeenCalledTimes(2)
      expect(scrollBehavior).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ path: '/foo' }),
        expect.objectContaining({ path: '/' }),
        null
      )
      expect(scrollBehavior).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ path: '/' }),
        expect.objectContaining({ path: '/foo' }),
        null
      )
    })

    it('ignores the scroll of navigations superseded before they finish', async () => {
      const scrollBehavior = vi.fn((to: { path: string }) => {
        return new Promise<{ top: number }>(resolve => {
          setTimeout(() => resolve({ top: positions[to.path] }), 100)
        })
      })
      const { router } = await newRouter({ scrollBehavior })
      scrollBehavior.mockClear()

      await router.push('/foo')
      router.push('/p/a')
      await router.push('/')

      expect(scrollBehavior).not.toHaveBeenCalledWith(
        expect.objectContaining({ path: '/p/a' }),
        expect.anything(),
        expect.anything()
      )

      await vi.runAllTimersAsync()

      expect(router.currentRoute.value.path).toBe('/')
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 3000 })
      )
    })

    it('does not report scroll errors from superseded navigations', async () => {
      const staleError = new Error('stale scroll')
      const scrollBehavior = vi.fn((to: { path: string }) => {
        return new Promise<{ top: number }>((resolve, reject) => {
          setTimeout(() => {
            if (to.path === '/foo') reject(staleError)
            else resolve({ top: positions[to.path] })
          }, 100)
        })
      })
      const onError = vi.fn()
      const { router } = await newRouter({ scrollBehavior })
      router.onError(onError)

      await router.push('/foo')
      await router.push('/')

      await vi.runAllTimersAsync()

      expect(router.currentRoute.value.path).toBe('/')
      expect(onError).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ top: 3000 })
      )
    })
  })

  describe('redirectedFrom', () => {
    it('adds a redirectedFrom property with a redirect in record', async () => {
      const { router } = await newRouter()
      await router.push('/foo')
      await router.push('/home')
      expect(router.currentRoute.value).toMatchObject({
        path: '/',
        name: 'home',
        redirectedFrom: { path: '/home' },
      })
    })

    it('adds a redirectedFrom property with beforeEnter', async () => {
      const { router } = await newRouter()
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
      const { router } = await newRouter()
      await expect(router.push('/to-foo')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    it('only triggers guards once with a redirect option', async () => {
      const { router } = await newRouter()
      const spy = vi.fn((_to, _from) => {})
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
      const { router } = await newRouter()
      await expect(router.push('/to-foo2')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo2',
      })
    })

    it('handles query and hash passed in redirect string', async () => {
      const { router } = await newRouter()
      await expect(router.push('/to-foo-query')).resolves.toEqual(undefined)
      expect(router.currentRoute.value).toMatchObject({
        name: 'Foo',
        path: '/foo',
        params: {},
        query: { a: ['2'] },
        hash: '#b',
        redirectedFrom: expect.objectContaining({
          fullPath: '/to-foo-query',
        }),
      })
    })

    // migration gap: record redirects do not keep the query and hash of the
    // target, use a function redirect that returns them
    it('does not keep query and hash when redirect is a string', async () => {
      const { router } = await newRouter()
      await expect(router.push('/to-foo?hey=foo#fa')).resolves.toEqual(
        undefined
      )
      expect(router.currentRoute.value).toMatchObject({
        name: 'Foo',
        fullPath: '/foo',
        query: {},
        hash: '',
        redirectedFrom: expect.objectContaining({
          fullPath: '/to-foo?hey=foo#fa',
        }),
      })
    })

    // migration gap: a named record redirect does not get the params, query,
    // and hash of the target. `{ name: 'Param' }` misses the required param
    // and `push()` throws synchronously
    it('does not keep params from targetLocation on a named redirect', async () => {
      const { router } = await newRouter()
      expect(() => router.push('/to-p/1?hey=foo#fa')).toThrowError(
        /missing required param "p"/i
      )
      expect(router.currentRoute.value.fullPath).toBe('/')
    })

    it('discard params on string redirect', async () => {
      const { router } = await newRouter()
      await router.push('/foo')
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
      const { router } = await newRouter()
      await expect(router.push('/to-foo-named')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo-named',
      })
    })

    it('keeps original replace if redirect', async () => {
      const history = createMemoryHistory()
      const { router } = await newRouter({ history })
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
      const { router } = await newRouter()
      await router.push('/inc-query-hash?n=3#fa')
      // the redirect returns a string query value
      expect('VUE_ROUTER_D0002').toHaveBeenWarned()
      const loc = router.currentRoute.value
      expect(loc).toMatchObject({
        name: 'Foo',
        query: {
          // `to.query.n` is an array: ['3'] + '-2'
          n: ['3-2'],
        },
        hash: '#fa-2',
      })
      expect(loc.redirectedFrom).toMatchObject({
        fullPath: '/inc-query-hash?n=3#fa',
        query: { n: ['3'] },
        hash: '#fa',
        path: '/inc-query-hash',
      })
    })

    it('allows a redirect with children', async () => {
      const { router } = await newRouter({
        routes: [
          { path: '/', component: components.Home },
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
      const { router } = createRouterWithRoutes({
        routes: [
          { name: 'foo', path: '/foo', redirect: '/bar' },
          { path: '/bar', component: components.Bar },
        ],
      })
      await expect(router.push('/foo')).resolves.toEqual(undefined)
      const loc = router.currentRoute.value
      // unnamed records get a generated Symbol name
      expect(typeof loc.name).toBe('symbol')
      expect(loc.path).toBe('/bar')
      expect(loc.redirectedFrom).toMatchObject({
        name: 'foo',
        path: '/foo',
      })
    })

    it('throws on relative redirects in dev', async () => {
      const { router } = await newRouter()
      router.addRoute({ path: '/relative-redirect', redirect: 'foo' })
      await router.push('/foo')
      expect(() => router.push('/relative-redirect')).toThrow()
      expect('VUE_ROUTER_R0008').toHaveBeenWarned()
      expect(router.currentRoute.value.fullPath).toBe('/foo')
    })
  })

  describe('base', () => {
    it('allows base option in abstract history', async () => {
      const history = createMemoryHistory('/app/')
      const { router } = createRouterWithRoutes({ history })
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
      const { router } = createRouterWithRoutes({ history })
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

  describe('resolve reactivity', () => {
    it('does not re-run a computed with an absolute location on navigation', async () => {
      const { router } = await newRouter()
      const scope = effectScope()
      let runs = 0
      const route = scope.run(() =>
        computed(() => {
          runs++
          return router.resolve('/foo')
        })
      )!
      expect(route.value.name).toBe('Foo')
      expect(runs).toBe(1)
      await router.push('/search')
      expect(route.value.name).toBe('Foo')
      expect(runs).toBe(1)
      scope.stop()
    })

    it('does not re-run a computed with an absolute object location on navigation', async () => {
      const { router } = await newRouter()
      const scope = effectScope()
      let runs = 0
      const route = scope.run(() =>
        computed(() => {
          runs++
          return router.resolve({
            path: '/foo',
            query: { q: ['1'] },
            hash: '#h',
          })
        })
      )!
      expect(route.value.fullPath).toBe('/foo?q=1#h')
      expect(runs).toBe(1)
      await router.push('/search')
      expect(route.value.fullPath).toBe('/foo?q=1#h')
      expect(runs).toBe(1)
      scope.stop()
    })

    it('re-runs a computed with a relative location on navigation', async () => {
      const { router } = await newRouter()
      const scope = effectScope()
      const route = scope.run(() => computed(() => router.resolve('child')))!
      expect(route.value.path).toBe('/child')
      await router.push('/parent/child')
      expect(route.value.path).toBe('/parent/child')
      scope.stop()
    })

    // the experimental router does not inherit params for named locations,
    // relative params locations still re-run on navigation
    it('re-runs a computed with a relative params location on navigation', async () => {
      const { router } = await newRouter()
      await router.push('/p/a')
      expect(() => router.resolve({ name: 'Param' })).toThrow()
      const scope = effectScope()
      const route = scope.run(() =>
        computed(() =>
          router.resolve({ params: {} }, router.currentRoute.value)
        )
      )!
      expect(route.value.path).toBe('/p/a')
      await router.push('/p/b')
      expect(route.value.path).toBe('/p/b')
      scope.stop()
    })

    it('re-runs a computed when routes are added or removed', async () => {
      const { router } = await newRouter({ routes: [routes[0]] })
      const scope = effectScope()
      const route = scope.run(() => computed(() => router.resolve('/late')))!
      expect(route.value.matched).toHaveLength(0)
      expect('No match found').toHaveBeenWarned()
      const remove = router.addRoute({
        path: '/late',
        name: 'late',
        component: components.Foo,
      })
      expect(route.value.matched).toHaveLength(1)
      remove()
      expect(route.value.matched).toHaveLength(0)
      router.addRoute({ path: '/late', component: components.Foo })
      expect(route.value.matched).toHaveLength(1)
      router.clearRoutes()
      expect(route.value.matched).toHaveLength(0)
      scope.stop()
    })
  })

  describe('Dynamic Routing', () => {
    it('resolves new added routes', async () => {
      const { router } = await newRouter({ routes: [] })
      expect(router.resolve('/new-route')).toMatchObject({
        name: NO_MATCH_LOCATION.name,
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
        name: NO_MATCH_LOCATION.name,
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
        beforeEnter(to, _from) {
          if (!removeRoute) {
            removeRoute = router.addRoute('dynamic parent', {
              path: 'child',
              name: 'dynamic child',
              component: components.Foo,
            })
            return to.fullPath
          } else return
        },
      })
      expect('VUE_ROUTER_D0001').toHaveBeenWarned()

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
      await router.replace({ name: 'new' })
      router.addRoute({
        path: '/new/bar',
        component: components.Foo,
        name: 'new',
      })
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
      await router.replace('/new/child')
      router.addRoute('new', {
        path: 'child',
        component: components.Bar,
        name: 'new-child',
      })
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
      router.removeRoute('Foo')
      expect(router.resolve('/foo')).toMatchObject({
        name: NO_MATCH_LOCATION.name,
        matched: [],
      })
      const removeRoute = router.addRoute({
        path: '/new-route',
        component: components.Foo,
        name: 'new route',
      })
      removeRoute()
      expect(router.resolve('/new-route')).toMatchObject({
        name: NO_MATCH_LOCATION.name,
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

    it('warns when the parent route is missing', async () => {
      const { router } = await newRouter()
      router.addRoute('parent-route', {
        path: '/p',
        component: components.Foo,
      })
      expect(
        'Parent route "parent-route" not found when adding child route'
      ).toHaveBeenWarned()
    })

    it('warns when removing a missing route', async () => {
      const { router } = await newRouter()
      router.removeRoute('route-name')
      expect('Cannot remove non-existent route "route-name"').toHaveBeenWarned()
    })

    it('removes the children with the parent', async () => {
      const { router } = await newRouter({ routes: [] })
      router.addRoute({
        path: '/parent',
        name: 'parent',
        component: components.Foo,
        children: [{ path: 'child', name: 'child', component: components.Bar }],
      })
      expect(router.resolve('/parent/child').name).toBe('child')
      router.removeRoute('parent')
      expect(router.hasRoute('child')).toBe(false)
      expect(router.resolve('/parent/child').matched).toEqual([])
      expect('No match found').toHaveBeenWarned()
    })

    it('lists the routes with getRoutes()', async () => {
      const { router } = await newRouter({ routes: [] })
      expect('No match found').toHaveBeenWarned()
      expect(router.getRoutes()).toEqual([])
      router.addRoute({ path: '/a', name: 'a', component: components.Foo })
      router.addRoute({ path: '/b', name: 'b', component: components.Foo })
      expect(router.getRoutes().map(r => r.name)).toEqual(
        expect.arrayContaining(['a', 'b'])
      )
      router.clearRoutes()
      expect(router.getRoutes()).toEqual([])
      expect(router.hasRoute('a')).toBe(false)
    })

    it('does not have dynamic routing methods with a fixed resolver', () => {
      const router = experimental_createRouter({
        history: createMemoryHistory(),
        resolver: createFixedResolver([
          normalizeRouteRecord({
            name: 'home',
            path: new MatcherPatternPathStatic('/'),
            components: { default: components.Home },
          }),
        ]),
      })
      expect('addRoute' in router).toBe(false)
      expect('removeRoute' in router).toBe(false)
      expect('clearRoutes' in router).toBe(false)
      expect(router.hasRoute('home')).toBe(true)
    })

    it('exposes the methods of the resolver', () => {
      const resolver = createDynamicResolver([
        { path: '/', name: 'home', component: components.Home },
      ])
      const router = experimental_createRouter({
        history: createMemoryHistory(),
        resolver,
      })
      expect(router.getRoute('home')).toBe(resolver.getRoute('home'))
      resolver.addRoute({ path: '/a', name: 'a', component: components.Foo })
      expect(router.hasRoute('a')).toBe(true)
      router.removeRoute('a')
      expect(resolver.getRoute('a')).toBeUndefined()
    })

    it('uses the resolver replaced during HMR', () => {
      const router = experimental_createRouter({
        history: createMemoryHistory(),
        resolver: createDynamicResolver(),
      })
      const newResolver = createDynamicResolver()
      router._hmrReplaceResolver!(newResolver)
      router.addRoute({ path: '/a', name: 'a', component: components.Foo })
      expect(newResolver.getRoute('a')).toBeDefined()
      // the router keeps its own resolve() that adds `href`
      expect(router.resolve('/a')).toMatchObject({ name: 'a', href: '/a' })
    })
  })
})
