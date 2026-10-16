/**
 * @vitest-environment happy-dom
 */
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Router, RouterHistory, RouterScrollBehavior } from '../src'
import type { EXPERIMENTAL_Router } from '../src/experimental'
import type * as VueRouter from '../src'
import type * as Experimental from '../src/experimental'
import { nextNavigation } from './utils'

type Modules = [typeof VueRouter, typeof Experimental]

// a new document only keeps history.state and sessionStorage
async function loadDocument(): Promise<Modules> {
  vi.resetModules()
  return [await import('../src'), await import('../src/experimental')]
}

const paths = ['/', '/b', '/c']

describe.each([
  [
    'router',
    (
      [{ createRouter }]: Modules,
      history: RouterHistory,
      scrollBehavior: RouterScrollBehavior
    ): Router =>
      createRouter({
        history,
        routes: paths.map(path => ({ path, component: {} })),
        scrollBehavior,
      }),
  ],
  [
    'experimental router',
    (
      [, experimental]: Modules,
      history: RouterHistory,
      scrollBehavior: RouterScrollBehavior
    ): EXPERIMENTAL_Router =>
      experimental.experimental_createRouter({
        history,
        resolver: experimental.createFixedResolver(
          paths.map(path =>
            experimental.normalizeRouteRecord({
              name: path,
              path: new experimental.MatcherPatternPathStatic(path),
              components: { default: {} },
            })
          )
        ),
        scrollBehavior,
      }),
  ],
] as const)('%s scroll history', (_name, create) => {
  describe.each([
    ['web', 'createWebHistory'],
    ['hash', 'createWebHashHistory'],
  ] as const)('%s history', (mode, createHistory) => {
    let history: RouterHistory
    let top = 0

    beforeEach(() => {
      sessionStorage.clear()
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
      sessionStorage.clear()
      vi.restoreAllMocks()
    })

    async function setup() {
      const modules = await loadDocument()
      history = modules[0][createHistory]()
      const scrollBehavior = vi.fn<RouterScrollBehavior>(
        (_to, _from, saved) => saved || { left: 0, top: 0 }
      )
      const router = create(modules, history, scrollBehavior)
      // the current url, to support reloads
      await router.push(history.location)
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

    it('restores the position saved on pagehide after a reload', async () => {
      const { push } = await setup()
      await push('/b')
      top = 1000
      const stateBefore = window.history.state
      const replaceState = vi.spyOn(window.history, 'replaceState')
      window.dispatchEvent(new Event('pagehide'))
      // replaceState() during pagehide can break the bfcache
      expect(replaceState).not.toHaveBeenCalled()
      expect(window.history.state).toEqual(stateBefore)
      replaceState.mockRestore()

      // reload: a new document keeps history.state and sessionStorage
      history.destroy()
      top = 0
      const { scrollBehavior } = await setup()

      expect(scrollBehavior.mock.lastCall?.[2]).toEqual({ left: 0, top: 1000 })
      expect(top).toBe(1000)
    })

    it('restores the position saved on push in a new document', async () => {
      const { push } = await setup()
      await push('/b')
      top = 1000
      await push('/c')

      // a new document at the /b entry, e.g. after leaving the app
      history.destroy()
      const popped = new Promise(resolve =>
        window.addEventListener('popstate', resolve, { once: true })
      )
      window.history.back()
      await popped
      top = 0
      const { scrollBehavior } = await setup()

      expect(scrollBehavior.mock.lastCall?.[2]).toEqual({ left: 0, top: 1000 })
      expect(top).toBe(1000)
    })

    it('restores the new entry after replacing the forward branch', async () => {
      const { scrollBehavior, push, go } = await setup()
      await push('/b')
      top = 1000
      await go(-1)
      await push('/b')
      top = 2000
      await push('/')
      await go(-1)

      expect(scrollBehavior.mock.lastCall?.[2]).toEqual({ left: 0, top: 2000 })
      expect(top).toBe(2000)
    })

    it.each([
      [
        'blocked',
        {
          get() {
            throw new DOMException('Access is denied', 'SecurityError')
          },
        },
      ],
      [
        'full',
        {
          value: new Proxy(sessionStorage, {
            set() {
              throw new DOMException('Quota exceeded', 'QuotaExceededError')
            },
          }),
        },
      ],
    ] as const)(
      'restores positions in the same document when sessionStorage is %s',
      async (_state, descriptor) => {
        const original = Object.getOwnPropertyDescriptor(
          globalThis,
          'sessionStorage'
        )!
        Object.defineProperty(globalThis, 'sessionStorage', {
          configurable: true,
          ...descriptor,
        })
        try {
          const { scrollBehavior, push, go } = await setup()
          await push('/b')
          top = 1000
          await push('/c')
          await go(-1)

          expect(scrollBehavior.mock.lastCall?.[2]).toEqual({
            left: 0,
            top: 1000,
          })
          expect(top).toBe(1000)
        } finally {
          Object.defineProperty(globalThis, 'sessionStorage', original)
        }
      }
    )

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
