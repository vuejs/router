/**
 * @vitest-environment happy-dom
 */
import type { MockInstance } from 'vitest'
import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createRouter } from '../src/router'
import { createMemoryHistory } from '../src/history/memory'
import { components } from './utils'

describe('scrollBehavior async race', () => {
  let scrollTo: MockInstance

  beforeEach(() => {
    vi.useFakeTimers()
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  })

  afterEach(() => {
    scrollTo.mockRestore()
    vi.useRealTimers()
  })

  it('ignores stale scroll results from superseded navigations', async () => {
    const scrollTops = new Map([
      ['/page-a', 1000],
      ['/page-b', 2000],
      ['/page-c', 3000],
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/page-a', component: components.Foo },
        { path: '/page-b', component: components.Bar },
        { path: '/page-c', component: components.Home },
      ],
      scrollBehavior(to) {
        const top = scrollTops.get(to.path) ?? 0
        return new Promise(resolve => {
          setTimeout(() => resolve({ top }), 300)
        })
      },
    })

    await router.push('/page-a')
    const navB = router.push('/page-b')
    const navC = router.push('/page-c')

    await vi.runAllTimersAsync()
    await navB
    await navC

    expect(router.currentRoute.value.path).toBe('/page-c')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 3000 })
    )
  })

  it('ignores stale scroll rejections from superseded navigations', async () => {
    const scrollTops = new Map([
      ['/page-b', 2000],
      ['/page-c', 3000],
    ])
    const staleError = new Error('stale')
    const onError = vi.fn()

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/page-a', component: components.Foo },
        { path: '/page-b', component: components.Bar },
        { path: '/page-c', component: components.Home },
      ],
      scrollBehavior(to) {
        if (to.path === '/page-a') {
          return new Promise((_resolve, reject) => {
            setTimeout(() => reject(staleError), 300)
          })
        }

        const top = scrollTops.get(to.path) ?? 0
        return new Promise(resolve => {
          setTimeout(() => resolve({ top }), 300)
        })
      },
    })
    router.onError(onError)

    await router.push('/page-a')
    const navB = router.push('/page-b')
    const navC = router.push('/page-c')

    await vi.runAllTimersAsync()
    await navB
    await navC

    expect(router.currentRoute.value.path).toBe('/page-c')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 3000 })
    )
    expect(onError).not.toHaveBeenCalled()
  })
})
