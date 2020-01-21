import { createRouter as newRouter } from '../src/router'
import { createDom, components } from './utils'
import { RouteRecord } from '../src/types'
import { createMemoryHistory } from '../src'
import * as encoding from '../src/utils/encoding'

jest.mock('../src/utils/encoding')

const routes: RouteRecord[] = [
  { path: '/', name: 'home', component: components.Home },
  { path: '/%25', name: 'percent', component: components.Home },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  { path: '/p/:p', component: components.Bar, name: 'params' },
  { path: '/p/:p+', component: components.Bar, name: 'repeat' },
]

// this function is meant to easy refactor in the future as Histories are going to be
// function-based
function createHistory() {
  const routerHistory = createMemoryHistory()
  return routerHistory
}

function createRouter() {
  const history = createHistory()
  const router = newRouter({ history, routes })
  return router
}

// TODO: test by spying on encode functions since things are already tested by encoding.spec.ts
describe('URL Encoding', () => {
  beforeAll(() => {
    createDom()
  })

  beforeEach(() => {
    // mock all encoding functions
    for (const key in encoding) {
      // @ts-ignore
      const value = encoding[key]
      // @ts-ignore
      if (typeof value === 'function') encoding[key] = jest.fn((v: string) => v)
    }
  })

  it('calls encodeParam with params object', async () => {
    const router = createRouter()
    await router.push({ name: 'params', params: { p: 'foo' } })
    expect(encoding.encodeParam).toHaveBeenCalledTimes(1)
    expect(encoding.encodeParam).toHaveBeenCalledWith('foo')
  })

  it('calls encodeParam with relative location', async () => {
    const router = createRouter()
    await router.push('/p/bar')
    await router.push({ params: { p: 'foo' } })
    expect(encoding.encodeParam).toHaveBeenCalledTimes(1)
    expect(encoding.encodeParam).toHaveBeenCalledWith('foo')
  })

  it('calls encodeParam with params object with arrays', async () => {
    const router = createRouter()
    await router.push({ name: 'repeat', params: { p: ['foo', 'bar'] } })
    expect(encoding.encodeParam).toHaveBeenCalledTimes(2)
    expect(encoding.encodeParam).toHaveBeenNthCalledWith(1, 'foo', 0, [
      'foo',
      'bar',
    ])
    expect(encoding.encodeParam).toHaveBeenNthCalledWith(2, 'bar', 1, [
      'foo',
      'bar',
    ])
  })

  it('calls decodeParam with a path', async () => {
    const router = createRouter()
    await router.push({ name: 'repeat', params: { p: ['foo', 'bar'] } })
    expect(encoding.encodeParam).toHaveBeenCalledTimes(2)
    expect(encoding.encodeParam).toHaveBeenNthCalledWith(1, 'foo', 0, [
      'foo',
      'bar',
    ])
    expect(encoding.encodeParam).toHaveBeenNthCalledWith(2, 'bar', 1, [
      'foo',
      'bar',
    ])
  })

  describe.skip('resolving locations', () => {
    it('encodes params when resolving', async () => {
      const router = createRouter()
      await router.push({ name: 'params', params: { p: '%€' } })
      const currentRoute = router.currentRoute.value
      expect(currentRoute.path).toBe(encodeURI('/p/%€'))
      expect(currentRoute.fullPath).toBe(encodeURI('/p/%€'))
      expect(currentRoute.query).toEqual({
        p: '%€',
      })
    })
  })
})
