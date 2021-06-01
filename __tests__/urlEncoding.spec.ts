import { createRouter as newRouter } from '../src/router'
import { components } from './utils'
import { RouteRecordRaw } from '../src/types'
import { createMemoryHistory } from '../src'
import * as encoding from '../src/encoding'

jest.mock('../src/encoding')

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: components.Home },
  { path: '/%25', name: 'percent', component: components.Home },
  { path: '/to-p/:p', redirect: to => `/p/${to.params.p}` },
  { path: '/p/:p', component: components.Bar, name: 'params' },
  { path: '/p/:p+', component: components.Bar, name: 'repeat' },
  { path: '/optional/:a/:b?', component: components.Bar, name: 'optional' },
]

function createRouter() {
  const history = createMemoryHistory()
  const router = newRouter({ history, routes })
  return router
}

describe('URL Encoding', () => {
  beforeEach(() => {
    // mock all encoding functions
    for (const key in encoding) {
      // @ts-expect-error
      const value = encoding[key]
      // @ts-expect-error
      if (typeof value === 'function') encoding[key] = jest.fn((v: string) => v)
      // @ts-expect-error
      else if (key === 'PLUS_RE') encoding[key] = /\+/g
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
    expect(encoding.encodeParam).toHaveBeenCalledTimes(2)
    expect(encoding.encodeParam).toHaveBeenCalledWith('bar')
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

  it('calls decode with a path', async () => {
    const router = createRouter()
    await router.push('/p/foo')
    // one extra time for hash
    expect(encoding.decode).toHaveBeenCalledTimes(2)
    expect(encoding.decode).toHaveBeenNthCalledWith(1, 'foo')
  })

  it('calls decode with a path with repeatable params', async () => {
    const router = createRouter()
    await router.push('/p/foo/bar')
    // one extra time for hash
    expect(encoding.decode).toHaveBeenCalledTimes(3)
    expect(encoding.decode).toHaveBeenNthCalledWith(1, 'foo', 0, ['foo', 'bar'])
    expect(encoding.decode).toHaveBeenNthCalledWith(2, 'bar', 1, ['foo', 'bar'])
  })

  it('decodes values in params', async () => {
    // @ts-expect-error: override to make the difference
    encoding.decode = () => 'd'
    // @ts-expect-error
    encoding.encodeParam = () => 'e'
    const router = createRouter()
    await router.push({ name: 'optional', params: { a: 'a%' } })
    await router.push({ params: { b: 'b%' } })
    expect(router.currentRoute.value).toMatchObject({
      fullPath: '/optional/e/e',
      params: { b: 'd', a: 'd' },
    })
  })

  it('calls encodeQueryProperty with query', async () => {
    const router = createRouter()
    await router.push({ name: 'home', query: { p: 'foo' } })
    expect(encoding.encodeQueryValue).toHaveBeenCalledTimes(1)
    expect(encoding.encodeQueryKey).toHaveBeenCalledTimes(1)
    expect(encoding.encodeQueryKey).toHaveBeenNthCalledWith(1, 'p')
    expect(encoding.encodeQueryValue).toHaveBeenNthCalledWith(1, 'foo')
  })

  it('calls decode with query', async () => {
    const router = createRouter()
    await router.push('/?p=foo')
    // one extra time for hash
    expect(encoding.decode).toHaveBeenCalledTimes(3)
    expect(encoding.decode).toHaveBeenNthCalledWith(1, 'p')
    expect(encoding.decode).toHaveBeenNthCalledWith(2, 'foo')
  })

  it('calls encodeQueryProperty with arrays in query', async () => {
    const router = createRouter()
    await router.push({ name: 'home', query: { p: ['foo', 'bar'] } })
    expect(encoding.encodeQueryValue).toHaveBeenCalledTimes(2)
    expect(encoding.encodeQueryKey).toHaveBeenCalledTimes(1)
    expect(encoding.encodeQueryKey).toHaveBeenNthCalledWith(1, 'p')
    expect(encoding.encodeQueryValue).toHaveBeenNthCalledWith(1, 'foo')
    expect(encoding.encodeQueryValue).toHaveBeenNthCalledWith(2, 'bar')
  })

  it('keeps decoded values in query', async () => {
    // @ts-expect-error: override to make the difference
    encoding.decode = () => 'd'
    // @ts-expect-error
    encoding.encodeQueryValue = () => 'ev'
    // @ts-expect-error
    encoding.encodeQueryKey = () => 'ek'
    const router = createRouter()
    await router.push({ name: 'home', query: { p: '%' } })
    expect(router.currentRoute.value).toMatchObject({
      fullPath: '/?ek=ev',
      query: { p: '%' },
    })
  })

  it('keeps decoded values in hash', async () => {
    // @ts-expect-error: override to make the difference
    encoding.decode = () => 'd'
    // @ts-expect-error
    encoding.encodeHash = () => '#e'
    const router = createRouter()
    await router.push({ name: 'home', hash: '#%' })
    expect(router.currentRoute.value).toMatchObject({
      fullPath: '/#e',
      hash: '#%',
    })
  })
  it('decodes hash', async () => {
    // @ts-expect-error: override to make the difference
    encoding.decode = () => '#d'
    // @ts-expect-error
    encoding.encodeHash = () => '#e'
    const router = createRouter()
    await router.push('#%20')
    expect(router.currentRoute.value).toMatchObject({
      fullPath: '/#%20',
      hash: '#d',
    })
  })
})
