import { NAVIGATION_TYPES, createDom } from '../utils'
import { createHistory, Router } from '../../src'

function createRouter(
  options: Partial<import('../../src/router').RouterOptions> & {
    routes: import('../../src/types').RouteRecord[]
  }
) {
  return new Router({
    history: createHistory(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }
const Nested = { template: `<div>Nested<router-view/></div>` }

/** @type {import('../../src/types').RouteRecord[]} */
const routes = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/nested',
    component: Nested,
    children: [
      { path: '', name: 'nested-default', component: Foo },
      { path: 'home', name: 'nested-home', component: Home },
    ],
  },
]

describe('router.afterEach', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls afterEach guards on push', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.afterEach(spy)
        await router[navigationMethod]('/foo')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(
          expect.objectContaining({ fullPath: '/foo' }),
          expect.objectContaining({ fullPath: '/' })
        )
      })

      it('can be removed', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        const remove = router.afterEach(spy)
        remove()
        await router[navigationMethod]('/foo')
        expect(spy).not.toHaveBeenCalled()
      })

      it('calls afterEach guards on push', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        await router.push('/nested')
        router.afterEach(spy)
        await router[navigationMethod]('/nested/home')
        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenLastCalledWith(
          expect.objectContaining({ name: 'nested-home' }),
          expect.objectContaining({ name: 'nested-default' })
        )
        await router[navigationMethod]('/nested')
        expect(spy).toHaveBeenLastCalledWith(
          expect.objectContaining({ name: 'nested-default' }),
          expect.objectContaining({ name: 'nested-home' })
        )
        expect(spy).toHaveBeenCalledTimes(2)
      })

      it('does not call afterEach if navigation is cancelled', async () => {
        const spy = jest.fn()
        const router = createRouter({ routes })
        router.afterEach(spy)
        router.beforeEach((to, from, next) => {
          next(false) // cancel the navigation
        })
        await router[navigationMethod]('/foo').catch(err => {}) // ignore the error
        expect(spy).not.toHaveBeenCalled()
      })
    })
  })
})
