import { createDom, newRouter as createRouter } from '../utils'
import { RouteRecordRaw } from 'src/types'

const Home = { template: `<div>Home</div>` }
const Foo = { template: `<div>Foo</div>` }
const Nested = { template: `<div>Nested<router-view/></div>` }

const routes: RouteRecordRaw[] = [
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

  it('calls afterEach guards on push', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    router.afterEach(spy)
    await router.push('/foo')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ fullPath: '/foo' }),
      expect.objectContaining({ fullPath: '/' }),
      undefined
    )
  })

  it('can be removed', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    const remove = router.afterEach(spy)
    remove()
    await router.push('/foo')
    expect(spy).not.toHaveBeenCalled()
  })

  it('calls afterEach guards on multiple push', async () => {
    const spy = jest.fn()
    const router = createRouter({ routes })
    await router.push('/nested')
    router.afterEach(spy)
    await router.push('/nested/home')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-home' }),
      expect.objectContaining({ name: 'nested-default' }),
      undefined
    )
    await router.push('/nested')
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'nested-default' }),
      expect.objectContaining({ name: 'nested-home' }),
      undefined
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
