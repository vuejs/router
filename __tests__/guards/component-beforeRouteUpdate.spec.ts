import fakePromise from 'faked-promise'
import { NAVIGATION_TYPES, createDom, noGuard } from '../utils'
import { createRouter as newRouter, createHistory } from '../../src'
import { RouteRecord } from '../../src/types'

function createRouter(
  options: Partial<import('../../src/router').RouterOptions> & {
    routes: import('../../src/types').RouteRecord[]
  }
) {
  return newRouter({
    history: createHistory(),
    ...options,
  })
}

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const beforeRouteUpdate = jest.fn()
const routes: RouteRecord[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
  {
    path: '/guard/:go',
    component: {
      ...Foo,
      beforeRouteUpdate,
    },
  },
]

beforeEach(() => {
  beforeRouteUpdate.mockReset()
})

describe('beforeRouteUpdate', () => {
  beforeAll(() => {
    createDom()
  })

  NAVIGATION_TYPES.forEach(navigationMethod => {
    describe(navigationMethod, () => {
      it('calls beforeRouteUpdate guards when changing params', async () => {
        const router = createRouter({ routes })
        beforeRouteUpdate.mockImplementationOnce(noGuard)
        await router[navigationMethod]('/guard/valid')
        // not called on initial navigation
        expect(beforeRouteUpdate).not.toHaveBeenCalled()
        await router[navigationMethod]('/guard/other')
        expect(beforeRouteUpdate).toHaveBeenCalledTimes(1)
      })

      it('resolves async components before guarding', async () => {
        const spy = jest.fn((to, from, next) => next())
        const component = {
          template: `<div></div>`,
          beforeRouteUpdate: spy,
        }
        const router = createRouter({
          routes: [
            ...routes,
            { path: '/async/:a', component: () => Promise.resolve(component) },
          ],
        })
        await router[navigationMethod]('/async/a')
        expect(spy).not.toHaveBeenCalled()
        await router[navigationMethod]('/async/b')
        expect(spy).toHaveBeenCalledTimes(1)
      })

      it('waits before navigating', async () => {
        const [promise, resolve] = fakePromise()
        const router = createRouter({ routes })
        beforeRouteUpdate.mockImplementationOnce(async (to, from, next) => {
          await promise
          next()
        })
        await router[navigationMethod]('/guard/one')
        const p = router[navigationMethod]('/guard/foo')
        expect(router.currentRoute.fullPath).toBe('/guard/one')
        resolve()
        await p
        expect(router.currentRoute.fullPath).toBe('/guard/foo')
      })
    })
  })
})
