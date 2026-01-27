/**
 * @vitest-environment happy-dom
 */
import { createRouter, createWebHistory } from '../src'
import { components, nextNavigation } from './utils'
import { RouteRecordRaw } from '../src/types'
import { Window as HappyDomWindow } from 'happy-dom'
import { describe, expect, it, vi } from 'vitest'

// to get a typed window
function getWindow(): HappyDomWindow {
  return window as unknown as HappyDomWindow
}

// override the value of isBrowser because the variable is created before happy-dom
// is created
vi.mock('../src/utils/env', () => ({
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
    beforeEnter: (to, from) => {
      return '/'
    },
  },
  { path: '/bar', component },
  { path: '/foo', component, name: 'Foo' },
  { path: '/to-foo', redirect: '/foo' },
]

describe('Initial Navigation', () => {
  function newRouter(
    url: string,
    options: Partial<Parameters<typeof createRouter>[0]> = {}
  ) {
    getWindow().happyDOM.setURL('https://example.com' + url)
    const history = options.history || createWebHistory()
    const router = createRouter({ history, routes, ...options })

    return { history, router }
  }

  it('handles initial navigation with redirect', async () => {
    const { history, router } = newRouter('/home')
    expect(history.location).toBe('/home')
    // this is done automatically on install but there is none here
    await router.push(history.location)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
    await router.push('/foo')
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' })
    history.go(-1)
    await nextNavigation(router)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
  })

  it('handles initial navigation with beforeEnter', async () => {
    const { history, router } = newRouter('/home-before')
    expect(history.location).toBe('/home-before')
    // this is done automatically on mount but there is no mount here
    await router.push(history.location)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
    await router.push('/foo')
    expect(router.currentRoute.value).toMatchObject({ path: '/foo' })
    history.go(-1)
    await nextNavigation(router)
    expect(router.currentRoute.value).toMatchObject({ path: '/' })
  })
})
