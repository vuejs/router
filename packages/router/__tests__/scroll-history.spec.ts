/**
 * @vitest-environment happy-dom
 */
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory, createWebHistory } from '../src'
import type { RouterHistory, RouterScrollBehavior } from '../src'
import {
  createFixedResolver,
  experimental_createRouter,
  MatcherPatternPathStatic,
  normalizeRouteRecord,
} from '../src/experimental'
import { nextNavigation } from './utils'
import { scrollPositions } from '../src/scrollBehavior'

const routes = ['/', '/b', '/c'].map(path => ({ path, component: {} }))
const resolver = createFixedResolver(
  routes.map(({ path, component }) =>
    normalizeRouteRecord({
      name: path,
      path: new MatcherPatternPathStatic(path),
      components: { default: component },
    })
  )
)

describe.each([
  [
    'router',
    (history: RouterHistory, scrollBehavior: RouterScrollBehavior) =>
      createRouter({ history, routes, scrollBehavior }),
  ],
  [
    'experimental router',
    (history: RouterHistory, scrollBehavior: RouterScrollBehavior) =>
      experimental_createRouter({ history, resolver, scrollBehavior }),
  ],
] as const)('%s scroll history', (_name, create) => {
  describe.each([
    ['web', createWebHistory],
    ['hash', createWebHashHistory],
  ] as const)('%s history', (mode, createHistory) => {
    let history: RouterHistory
    let top = 0

    beforeEach(() => {
      scrollPositions.clear()
      window.history.replaceState(null, '', '/')
      top = 0
      vi.spyOn(window, 'scrollX', 'get').mockReturnValue(0)
      vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => top)
      vi.spyOn(window, 'scrollTo').mockImplementation(
        (options: ScrollToOptions | number, y?: number) => {
          top = typeof options === 'number' ? (y ?? top) : (options.top ?? top)
        }
      )
    })

    afterEach(() => {
      history?.destroy()
      scrollPositions.clear()
      vi.restoreAllMocks()
    })

    async function setup() {
      history = createHistory()
      const scrollBehavior = vi.fn<RouterScrollBehavior>(
        (_to, _from, saved) => saved || { left: 0, top: 0 }
      )
      const router = create(history, scrollBehavior)
      await router.push('/')
      await nextTick()

      async function push(path: string) {
        await router.push(path)
        await nextTick()
      }

      async function go(delta: number) {
        const navigation = nextNavigation(router)
        router.go(delta)
        await navigation
        await nextTick()
      }

      return { router, scrollBehavior, push, go }
    }

    it('restores the new entry after replacing the forward branch', async () => {
      const { scrollBehavior, push, go } = await setup()
      await push('/b')
      top = 1000
      await go(-1)
      await push('/b')
      top = 2000
      await push('/')
      await go(-1)

      expect(window.history.state.scroll.top).toBe(2000)
      expect(scrollBehavior.mock.lastCall?.[2]).toEqual({ left: 0, top: 2000 })
      expect(top).toBe(2000)
    })

    it('discards cached URLs from the whole removed branch', async () => {
      const { router, scrollBehavior, push, go } = await setup()
      await push('/b')
      await push('/#anchor')
      top = 1000
      await go(-2)
      await push('/b')
      await push('/')

      const navigation = nextNavigation(router)
      window.location.hash = mode === 'hash' ? '#/#anchor' : '#anchor'
      // happy-dom does not dispatch popstate for native hash changes.
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
      await navigation
      await nextTick()

      expect(router.currentRoute.value.fullPath).toBe('/#anchor')
      expect(scrollBehavior.mock.lastCall?.[2]).toBe(null)
      expect(top).toBe(0)
    })

    it.each(['push', 'replace'] as const)(
      'preserves newer cached positions for entries retained by %s',
      async operation => {
        const { router, scrollBehavior, push, go } = await setup()
        await push('/b')
        top = 1000
        await push('/c')
        await go(-1)
        top = 2000
        await go(1)
        await router[operation]('/')
        await nextTick()
        if (operation === 'push') await go(-1)
        await go(-1)

        expect(window.history.state.scroll.top).toBe(1000)
        expect(scrollBehavior.mock.lastCall?.[2]).toEqual({
          left: 0,
          top: 2000,
        })
        expect(top).toBe(2000)
      }
    )

    it('discards cached URLs from a replaced entry after an aborted pop', async () => {
      const { router, scrollBehavior, push, go } = await setup()
      await push('/#anchor')
      top = 1000
      const removeGuard = router.beforeEach(to => to.fullPath !== '/')
      await go(-1)
      removeGuard()
      expect(router.currentRoute.value.fullPath).toBe('/#anchor')

      await router.replace('/')
      await nextTick()
      const navigation = nextNavigation(router)
      window.location.hash = mode === 'hash' ? '#/#anchor' : '#anchor'
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))
      await navigation
      await nextTick()

      expect(scrollBehavior.mock.lastCall?.[2]).toBe(null)
      expect(top).toBe(0)
    })

    it('uses the updated position after pushing from an aborted pop', async () => {
      const { router, scrollBehavior, push, go } = await setup()
      await push('/b')
      top = 1000
      const removeGuard = router.beforeEach(to => to.path !== '/')
      await go(-1)
      removeGuard()
      top = 2000
      await push('/c')
      await go(-1)

      expect(window.history.state.scroll.top).toBe(2000)
      expect(scrollBehavior.mock.lastCall?.[2]).toEqual({ left: 0, top: 2000 })
      expect(top).toBe(2000)
    })

    it.each(['aborted', 'duplicated'] as const)(
      'preserves the forward branch on a %s push',
      async failure => {
        const { router, scrollBehavior, push, go } = await setup()
        await push('/b')
        await push('/c')
        top = 2000
        await go(-2)
        const removeGuard = router.beforeEach(to => to.path !== '/b')
        await router.push(failure === 'aborted' ? '/b' : '/')
        removeGuard()
        await go(2)

        expect(scrollBehavior.mock.lastCall?.[2]).toEqual({
          left: 0,
          top: 2000,
        })
        expect(top).toBe(2000)
      }
    )
  })
})
