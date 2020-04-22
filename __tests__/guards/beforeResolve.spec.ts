import { createDom, noGuard, newRouter as createRouter } from '../utils'
import { RouteRecordRaw } from '../../src/types'

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/foo', component: Foo },
]

describe('router.beforeEach', () => {
  beforeAll(() => {
    createDom()
  })

  it('calls beforeEach guards on navigation', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.beforeResolve(spy)
    spy.mockImplementationOnce(noGuard)
    await router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
