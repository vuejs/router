import fakePromise from 'faked-promise'
import { createDom, tick, noGuard, newRouter as createRouter } from '../utils'
import { RouteRecordRaw, RouteLocationRaw } from '../../src/types'

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }
const Nested = { template: `<div>Nested<router-view/></div>` }

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  { path: '/other', component: Foo },
  { path: '/n/:i', name: 'n', component: Home, meta: { requiresLogin: true } },
  {
    path: '/nested',
    component: Nested,
    children: [
      { path: '', name: 'nested-default', component: Foo },
      { path: 'home', name: 'nested-home', component: Home },
    ],
  },
  {
    path: '/redirect',
    redirect: { path: '/other', state: { fromRecord: true } },
  },
]

describe('router.beforeEach', () => {
  beforeAll(() => {
    createDom()
  })

  it('calls beforeEach guards on navigation', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.beforeEach(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('can be removed', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    const remove = router.beforeEach(spy)
    remove()
    spy.mockImplementationOnce(noGuard)
    await router.push('/foo')
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not call beforeEach guard if we were already on the page', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    await router.push('/foo')
    router.beforeEach(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/foo')
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls beforeEach guards on navigation between children routes', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    await router.push('/nested')
    router.beforeEach(spy)
    spy.mockImplementation(noGuard)
    await router.push('/nested/home')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-home' }),
      expect.objectContaining({ name: 'nested-default' }),
      expect.any(Function)
    )
    await router.push('/nested')
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-default' }),
      expect.objectContaining({ name: 'nested-home' }),
      expect.any(Function)
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('can redirect to a different location', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    await router.push('/foo')
    spy.mockImplementation((to, from, next) => {
      // only allow going to /other
      if (to.fullPath !== '/other') next('/other')
      else next()
    })
    router.beforeEach(spy)
    expect(spy).not.toHaveBeenCalled()
    await router.push('/')
    expect(spy).toHaveBeenCalledTimes(2)
    // called before redirect
    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: '/' }),
      expect.objectContaining({ path: '/foo' }),
      expect.any(Function)
    )
    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: '/other' }),
      expect.objectContaining({ path: '/foo' }),
      expect.any(Function)
    )
    expect(router.currentRoute.value.fullPath).toBe('/other')
  })

  it('can add state when redirecting', async () => {
    const router = createRouter({ routes })
    await router.push('/foo')
    router.beforeEach((to, from) => {
      // only allow going to /other
      if (to.fullPath !== '/other') {
        return {
          path: '/other',
          state: { added: 'state' },
        }
      }
      return
    })

    const spy = jest.spyOn(history, 'pushState')
    await router.push({ path: '/', state: { a: 'a' } })
    expect(spy).toHaveBeenCalledTimes(1)
    // called before redirect
    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ added: 'state', a: 'a' }),
      '',
      expect.stringMatching(/\/other$/)
    )
    spy.mockClear()
  })

  it('can add state to a redirect route', async () => {
    const router = createRouter({ routes })
    await router.push('/foo')

    const spy = jest.spyOn(history, 'pushState')
    await router.push({ path: '/redirect', state: { a: 'a' } })
    expect(spy).toHaveBeenCalledTimes(1)
    // called before redirect
    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ fromRecord: true, a: 'a' }),
      '',
      expect.stringMatching(/\/other$/)
    )
    spy.mockClear()
  })

  async function assertRedirect(redirectFn: (i: string) => RouteLocationRaw) {
    const spy = jest.fn()
    const router = createRouter({ routes })
    await router.push('/')
    spy.mockImplementation((to, from, next) => {
      // only allow going to /other
      const i = Number(to.params.i)
      if (i >= 3) next()
      else next(redirectFn(String(i + 1)))
    })
    router.beforeEach(spy)
    expect(spy).not.toHaveBeenCalled()
    await router.push('/n/0')
    expect(spy).toHaveBeenCalledTimes(4)
    expect(router.currentRoute.value.fullPath).toBe('/n/3')
  }

  it('can redirect multiple times with string redirect', async () => {
    await assertRedirect(i => '/n/' + i)
  })

  it('can redirect multiple times with path object', async () => {
    await assertRedirect(i => ({ path: '/n/' + i }))
  })

  it('can redirect multiple times with named route', async () => {
    await assertRedirect(i => ({ name: 'n', params: { i } }))
  })

  it('is called when changing params', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes: [...routes] })
    await router.push('/n/2')
    spy.mockImplementation(noGuard)
    router.beforeEach(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/n/1')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('is not called with same params', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes: [...routes] })
    await router.push('/n/2')
    spy.mockImplementation(noGuard)
    router.beforeEach(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/n/2')
    expect(spy).not.toHaveBeenCalled()
  })

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    router.beforeEach(async (to, from, next) => {
      await promise
      next()
    })
    const p = router.push('/foo')
    expect(router.currentRoute.value.fullPath).toBe('/')
    resolve()
    await p
    expect(router.currentRoute.value.fullPath).toBe('/foo')
  })

  it('waits in the right order', async () => {
    const [p1, r1] = fakePromise()
    const [p2, r2] = fakePromise()
    const router = createRouter({ routes })
    const guard1 = jest.fn()
    let order = 0
    guard1.mockImplementationOnce(async (to, from, next) => {
      expect(order++).toBe(0)
      await p1
      next()
    })
    router.beforeEach(guard1)
    const guard2 = jest.fn()
    guard2.mockImplementationOnce(async (to, from, next) => {
      expect(order++).toBe(1)
      await p2
      next()
    })
    router.beforeEach(guard2)
    let navigation = router.push('/foo')
    expect(router.currentRoute.value.fullPath).toBe('/')
    expect(guard1).not.toHaveBeenCalled()
    expect(guard2).not.toHaveBeenCalled()
    r1() // resolve the first guard
    await tick() // wait a tick
    await tick() // mocha requires an extra tick here
    expect(guard1).toHaveBeenCalled()
    // we haven't resolved the second gurad yet
    expect(router.currentRoute.value.fullPath).toBe('/')
    r2()
    await navigation
    expect(guard2).toHaveBeenCalled()
    expect(router.currentRoute.value.fullPath).toBe('/foo')
  })

  it('adds meta information', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.beforeEach(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/n/2')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ meta: { requiresLogin: true } }),
      expect.objectContaining({ meta: {} }),
      expect.any(Function)
    )
  })
})
