import { JSDOM } from 'jsdom'
import { createRouter, createWebHistory, Router } from '../src'
import { createDom, components } from './utils'
import { RouteRecordRaw } from '../src/types'

// override the value of isBrowser because the variable is created before JSDOM
// is created
jest.mock('../src/utils/env', () => ({
  isBrowser: true,
}))

// generic component because we are not displaying anything so it doesn't matter
const component = components.Home

const routes: RouteRecordRaw[] = [
  { path: '/home', redirect: '/' },
  { path: '/', component },
  {
    path: '/home-before',
    component,
    beforeEnter: (to, from, next) => {
      next('/')
    },
  },
  { path: '/bar', component },
  { path: '/foo', component, name: 'Foo' },
  { path: '/to-foo', redirect: '/foo' },
]

describe('Initial Navigation', () => {
  let dom: JSDOM
  function newRouter(
    url: string,
    options: Partial<Parameters<typeof createRouter>[0]> = {}
  ) {
    dom.reconfigure({ url: 'https://example.com' + url })
    const history = options.history || createWebHistory()
    const router = createRouter({ history, routes, ...options })

    return { history, router }
  }

  function nextNavigation(router: Router) {
    return new Promise((resolve, reject) => {
      let removeAfter = router.afterEach((_to, _from, failure) => {
        removeAfter()
        removeError()
        resolve(failure)
      })
      let removeError = router.onError(err => {
        removeAfter()
        removeError()
        reject(err)
      })
    })
  }

  beforeAll(() => {
    dom = createDom()
  })

  afterAll(() => {
    dom.window.close()
  })

  it('handles initial navigation with redirect', async () => {
    const { history, router } = newRouter('/home')
    expect(history.location.fullPath).toBe('/home')
    // this is done automatically on mount but there is no mount here
    await router.push(history.location.fullPath)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
    await router.push('/foo')
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' })
    history.go(-1)
    await nextNavigation(router)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
  })

  it('handles initial navigation with beforEnter', async () => {
    const { history, router } = newRouter('/home-before')
    expect(history.location.fullPath).toBe('/home-before')
    // this is done automatically on mount but there is no mount here
    await router.push(history.location.fullPath)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
    await router.push('/foo')
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' })
    history.go(-1)
    await nextNavigation(router)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
  })
})
