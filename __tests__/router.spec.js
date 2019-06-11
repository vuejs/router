// @ts-check
require('./helper')
const expect = require('expect')
const fakePromise = require('faked-promise')
const { HTML5History } = require('../src/history/html5')
const { AbstractHistory } = require('../src/history/abstract')
const { Router } = require('../src/router')
const { createDom, components, tick } = require('./utils')

function mockHistory() {
  // TODO: actually do a mock
  return new HTML5History()
}

/** @type {import('../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: components.Home },
  { path: '/foo', component: components.Foo, name: 'Foo' },
  { path: '/to-foo', redirect: '/foo' },
  { path: '/to-foo-named', redirect: { name: 'Foo' } },
  { path: '/to-foo2', redirect: '/to-foo' },
  { path: '/p/:p', component: components.Bar },
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
    const history = mockHistory()
    const router = new Router({ history, routes })
    expect(router.currentRoute).toEqual({
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
    })
  })

  it('calls history.push with router.push', async () => {
    const history = mockHistory()
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
    const history = mockHistory()
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

  describe('navigation', () => {
    it('cancels pending navigations if a newer one is finished on push', async () => {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = mockHistory()
      const router = new Router({
        history,
        routes: [
          {
            path: '/a',
            component: components.Home,
            async beforeEnter(to, from, next) {
              expect(from.fullPath).toBe('/')
              await p1
              next()
            },
          },
          {
            path: '/b',
            component: components.Foo,
            name: 'Foo',
            async beforeEnter(to, from, next) {
              expect(from.fullPath).toBe('/')
              await p2
              next()
            },
          },
        ],
      })
      const pA = router.push('/a')
      const pB = router.push('/b')
      // we resolve the second navigation first then the first one
      // and the first navigation should be ignored
      r2()
      await pB
      expect(router.currentRoute.fullPath).toBe('/b')
      r1()
      try {
        await pA
      } catch (err) {
        // TODO: expect error
      }
      expect(router.currentRoute.fullPath).toBe('/b')
    })

    it('cancels pending navigations if a newer one is finished on user navigation (from history)', async () => {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = new AbstractHistory()
      const router = new Router({ history, routes })
      // navigate first to add entries to the history stack
      await router.push('/p/initial')
      await router.push('/p/a')
      await router.push('/p/b')

      router.beforeEach(async (to, from, next) => {
        if (to.fullPath === '/p/initial') {
          // because we delay navigation, we are coming from /p/b
          expect(from.fullPath).toBe('/p/b')
          await p1
        } else {
          expect(from.fullPath).toBe('/p/b')
          await p2
        }
        next()
      })

      // trigger to history.back()
      history.back()
      history.back()

      expect(router.currentRoute.fullPath).toBe('/p/b')
      // resolves the last call to history.back() first
      // so we end up on /p/initial
      r1()
      await tick()
      expect(router.currentRoute.fullPath).toBe('/p/initial')
      // resolves the pending navigation, this should be cancelled
      r2()
      await tick()
      expect(router.currentRoute.fullPath).toBe('/p/initial')
    })

    it('cancels pending in-guard navigations if a newer one is finished on user navigation (from history)', async () => {
      const [p1, r1] = fakePromise()
      const [p2, r2] = fakePromise()
      const history = new AbstractHistory()
      const router = new Router({ history, routes })
      // navigate first to add entries to the history stack
      await router.push('/p/initial')
      await router.push('/p/a')
      await router.push('/p/b')

      router.beforeEach(async (to, from, next) => {
        console.log('going to', to.fullPath, 'from', from.fullPath)
        if (to.fullPath === '/p/initial') {
          console.log('waiting for p1')
          await p1
          console.log('done with p1')
          next()
        } else if (from.fullPath === '/p/b') {
          console.log('waiting for p2')
          await p2
          console.log('done with p2')
          next('/p/other-place')
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
      expect(router.currentRoute.fullPath).toBe('/p/initial')
      // resolves the pending navigation, this should be cancelled
      r2()
      await tick()
      expect(router.currentRoute.fullPath).toBe('/p/initial')
    })
  })

  describe('matcher', () => {
    it('handles one redirect from route record', async () => {
      const history = mockHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo',
      })
    })

    it('drops query and params on redirect if not provided', async () => {
      const history = mockHistory()
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
      const history = mockHistory()
      const router = new Router({ history, routes })
      const loc = await router.push('/to-foo-named')
      expect(loc.name).toBe('Foo')
      expect(loc.redirectedFrom).toMatchObject({
        path: '/to-foo-named',
      })
    })

    it('can pass on query and hash when redirecting', async () => {
      const history = mockHistory()
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
      const history = mockHistory()
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

  // it('redirects with route record redirect')
})
