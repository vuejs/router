import { createRouter as newRouter, createMemoryHistory } from '../src'
import { ErrorTypes } from '../src/errors'
import { components, tick } from './utils'
import { RouteRecordRaw } from '../src/types'

const routes: RouteRecordRaw[] = [
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
  const history = createMemoryHistory()
  const router = newRouter({
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
      expect(err.type).toBe(ErrorTypes.NAVIGATION_ABORTED)
    }
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ type: ErrorTypes.NAVIGATION_ABORTED })
    )
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
      expect.objectContaining({ type: ErrorTypes.NAVIGATION_GUARD_REDIRECT })
    )
    expect(onError.mock.calls[0]).toMatchObject([
      { to: { params: { p: '1' } }, from: { fullPath: '/p/0' } },
    ])
    expect(onError).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: ErrorTypes.NAVIGATION_ABORTED })
    )
    expect(onError.mock.calls[1]).toMatchObject([
      { to: { params: { p: '1' } }, from: { params: { p: 'other' } } },
    ])
  })
})
