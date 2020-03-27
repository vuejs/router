import fakePromise from 'faked-promise'
import { createDom, noGuard } from '../utils'
import { createRouter as newRouter, createWebHistory } from '../../src'
import { RouteRecord } from '../../src/types'

function createRouter(
  options: Partial<import('../../src/router').RouterOptions> & {
    routes: import('../../src/types').RouteRecord[]
  }
) {
  return newRouter({
    history: createWebHistory(),
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

  it('calls beforeRouteUpdate guards when changing params', async () => {
    const router = createRouter({ routes })
    beforeRouteUpdate.mockImplementationOnce(noGuard)
    await router.push('/guard/valid')
    // not called on initial navigation
    expect(beforeRouteUpdate).not.toHaveBeenCalled()
    await router.push('/guard/other')
    expect(beforeRouteUpdate).toHaveBeenCalledTimes(1)
  })

  it('waits before navigating', async () => {
    const [promise, resolve] = fakePromise()
    const router = createRouter({ routes })
    beforeRouteUpdate.mockImplementationOnce(async (to, from, next) => {
      await promise
      next()
    })
    await router.push('/guard/one')
    const p = router.push('/guard/foo')
    expect(router.currentRoute.value.fullPath).toBe('/guard/one')
    resolve()
    await p
    expect(router.currentRoute.value.fullPath).toBe('/guard/foo')
  })

  it.todo('invokes with the component context')
  it.todo('invokes with the component context with named views')
  it.todo('invokes with the component context with nested views')
  it.todo('invokes with the component context with nested named views')
})
