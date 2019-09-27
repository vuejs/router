// @ts-check
const fakePromise = require('faked-promise')
const { AbstractHistory } = require('../src/history/abstract')
const { Router } = require('../src/router')
const {
  NavigationAborted,
  NavigationCancelled,
  NavigationGuardRedirect,
} = require('../src/errors')
const { components, tick } = require('./utils')

/** @type {import('../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: components.Home },
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

const onError = jest.fn()
function createRouter() {
  const history = new AbstractHistory()
  const router = new Router({
    history,
    routes,
  })

  router.onError(onError)
  return { router, history }
}

describe('Errors', () => {
  beforeEach(() => {
    onError.mockReset()
  })

  it('triggers onError when navigation is aborted', async () => {
    const { router } = createRouter()
    router.beforeEach((to, from, next) => {
      next(false)
    })

    try {
      await router.push('/foo')
    } catch (err) {
      expect(err).toBeInstanceOf(NavigationAborted)
    }
    expect(onError).toHaveBeenCalledWith(expect.any(NavigationAborted))
  })

  it('triggers erros caused by new navigations of a next(redirect) trigered by history', async () => {
    const { router, history } = createRouter()
    await router.push('/p/0')
    await router.push('/p/other')

    router.beforeEach((to, from, next) => {
      const p = (Number(to.params.p) || 0) + 1
      if (p === 2) next(false)
      else next({ name: 'Param', params: { p: '' + p } })
    })

    history.back()
    await tick()

    expect(onError).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenNthCalledWith(
      1,
      expect.any(NavigationGuardRedirect)
    )
    expect(onError.mock.calls[0]).toMatchObject([
      { to: { params: { p: '1' } }, from: { fullPath: '/p/0' } },
    ])
    expect(onError).toHaveBeenNthCalledWith(2, expect.any(NavigationAborted))
    expect(onError.mock.calls[1]).toMatchObject([
      { to: { params: { p: '1' } }, from: { params: { p: 'other' } } },
    ])
  })
})
