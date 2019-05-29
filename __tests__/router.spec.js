// @ts-check
require('./helper')
const expect = require('expect')
const { HTML5History } = require('../src/history/html5')
const { Router } = require('../src/router')
const { createDom, components } = require('./utils')

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
