/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRouter } from '../router'
import { createMemoryHistory } from '../history/memory'
import type { RouterHistory } from '../history/common'
import { RouterView } from '../RouterView'
import { experimental_createRouter, normalizeRouteRecord } from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './route-resolver/matchers/matcher-pattern'
import {
  ScrollRestoration,
  useScrollRestoration,
  type ScrollRestorationContext,
  type ScrollRestorationPluginOptions,
} from './scroll-restoration'

enableAutoUnmount(afterEach)
afterEach(() => sessionStorage.clear())

describe.each(['classic', 'experimental'] as const)(
  '%s scroll restoration context',
  kind => {
    async function setup({
      manual = false,
      history = createMemoryHistory(),
      setupListeners,
      beforeMount = false,
    }: {
      manual?: boolean
      history?: RouterHistory
      setupListeners?: ScrollRestorationPluginOptions['setupListeners']
      beforeMount?: boolean
    } = {}) {
      let top = 0
      let scroll!: () => void
      const capture = vi.fn((context: ScrollRestorationContext) => {
        captures.push(context)
        return { default: { top } }
      })
      const captures: ScrollRestorationContext[] = []
      const restores: ScrollRestorationContext[] = []
      const Page = defineComponent({
        setup() {
          ;({ scroll } = useScrollRestoration({
            manual,
            key: (route, context) => `${route.path}:${context.historyPosition}`,
          }))
        },
        template: '<main>{{ $route.path }}</main>',
      })
      const paths = ['/', '/a', '/b', '/c', '/slow', '/blocked', '/redirect']
      const router =
        kind === 'classic'
          ? createRouter({
              history,
              routes: [
                ...paths.map(path => ({ path, component: Page })),
                { path: '/parts/:segments+', component: Page },
              ],
            })
          : experimental_createRouter({
              history,
              resolver: createFixedResolver([
                ...paths.map(path =>
                  normalizeRouteRecord({
                    name: path,
                    path: new MatcherPatternPathStatic(path),
                    components: { default: Page },
                  })
                ),
                normalizeRouteRecord({
                  name: 'parts',
                  path: new MatcherPatternPathDynamic(
                    /^\/parts\/(.+)$/,
                    { segments: [undefined, true] },
                    ['parts', 1]
                  ),
                  components: { default: Page },
                }),
              ]),
            })
      history.replace('/')
      if (beforeMount) await router.push('/a')
      const wrapper = mount(
        defineComponent({
          components: { RouterView },
          template: '<RouterView />',
        }),
        {
          global: {
            plugins: [
              [
                ScrollRestoration,
                {
                  router,
                  capture,
                  restore(entry, _route, context: ScrollRestorationContext) {
                    restores.push(context)
                    // Opt in to restoring traversals/initial load, but reset new links.
                    top =
                      context.type === 'push' || context.type === 'replace'
                        ? 0
                        : entry?.default?.top || 0
                  },
                  ...(setupListeners && { setupListeners }),
                } satisfies ScrollRestorationPluginOptions,
              ],
              router,
            ],
          },
        }
      )
      await router.isReady()
      await flushPromises()
      const push = async (path: string) => {
        await router.push(path)
        await flushPromises()
      }
      const go = async (delta: number) => {
        router.go(delta)
        await flushPromises()
      }
      return {
        router,
        wrapper,
        push,
        go,
        captures,
        restores,
        scroll: () => scroll(),
        top: () => top,
        setTop: (value: number) => {
          top = value
        },
      }
    }

    it('keeps distinct entries through links, Back, Forward and branch replacement', async () => {
      const s = await setup()
      expect(s.restores.at(-1)).toMatchObject({
        type: 'initial',
        historyPosition: 0,
      })
      await s.push('/a')
      s.setTop(600)
      await s.push('/b')
      expect(s.top()).toBe(0)
      expect(s.captures.at(-1)).toMatchObject({
        type: 'push',
        historyPosition: 1,
        route: { path: '/a' },
        from: { path: '/a' },
        to: { path: '/b' },
      })
      const captured = s.captures.at(-1)!
      s.setTop(300)
      await s.go(-1)
      expect(s.top()).toBe(600)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        direction: 'back',
        delta: -1,
        historyPosition: 1,
      })
      expect(s.captures.at(-1)).toMatchObject({
        historyPosition: 2,
        route: { path: '/b' },
      })
      s.setTop(700)
      await s.go(1)
      expect(s.top()).toBe(300)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        direction: 'forward',
        delta: 1,
        historyPosition: 2,
      })
      await s.push('/a')
      expect(s.top()).toBe(0)
      expect(s.restores.at(-1)?.historyPosition).toBe(3)
      await s.go(-2)
      expect(s.top()).toBe(700)
      // The discarded forward branch can reuse position 2. A new push must
      // still start at the top rather than restore its stale /b entry.
      await s.push('/b')
      expect(s.top()).toBe(0)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'push',
        delta: 0,
        direction: '',
        historyPosition: 2,
      })
      expect(captured).toMatchObject({
        type: 'push',
        historyPosition: 1,
        to: { path: '/b' },
      })
      expect(Object.isFrozen(captured)).toBe(true)
    })

    it('detaches and freezes target params/query arrays without freezing the live route', async () => {
      const s = await setup()
      await s.push('/parts/one/two?tag=x&tag&tag=&tag=y')
      const live = s.router.currentRoute.value
      const context = s.restores.at(-1)!
      for (const snapshot of [context.route, context.to]) {
        expect(snapshot.params.segments).toEqual(['one', 'two'])
        expect(snapshot.query.tag).toEqual(['x', null, '', 'y'])
        expect(snapshot.params).not.toBe(live.params)
        expect(snapshot.query).not.toBe(live.query)
        expect(snapshot.params.segments).not.toBe(live.params.segments)
        expect(snapshot.query.tag).not.toBe(live.query.tag)
        for (const value of [
          snapshot,
          snapshot.params,
          snapshot.query,
          snapshot.params.segments,
          snapshot.query.tag,
        ]) {
          expect(Object.isFrozen(value)).toBe(true)
        }
        expect(() =>
          (snapshot.params.segments as string[]).push('callback')
        ).toThrow(TypeError)
        expect(() =>
          (snapshot.query.tag as (string | null)[]).push(null)
        ).toThrow(TypeError)
        expect(() =>
          Object.assign(snapshot.params, { segments: ['callback'] })
        ).toThrow(TypeError)
        expect(() =>
          Object.assign(snapshot.query, { tag: 'callback' })
        ).toThrow(TypeError)
      }
      // Rejected callback writes did not reach the real normalized values.
      expect(live.params.segments).toEqual(['one', 'two'])
      expect(live.query.tag).toEqual(['x', null, '', 'y'])
      expect(Object.isFrozen(live.params)).toBe(false)
      expect(Object.isFrozen(live.query)).toBe(false)
      expect(Object.isFrozen(live.params.segments)).toBe(false)
      expect(Object.isFrozen(live.query.tag)).toBe(false)
      ;(live.params.segments as string[]).push('live')
      ;(live.query.tag as (string | null)[]).push('live')
      live.query.extra = 'live'
      for (const snapshot of [context.route, context.to]) {
        expect(snapshot.params.segments).toEqual(['one', 'two'])
        expect(snapshot.query.tag).toEqual(['x', null, '', 'y'])
        expect(snapshot.query.extra).toBeUndefined()
      }
    })

    it('isolates both sides of capture and restore contexts from the departing and target routes', async () => {
      const s = await setup()
      await s.push('/parts/a/b?tag=x&tag')
      const from = s.router.currentRoute.value
      await s.push('/parts/c/d?tag=z&tag=')
      const to = s.router.currentRoute.value
      const captured = s.captures.at(-1)!
      const restored = s.restores.at(-1)!
      expect(captured.route).toBe(captured.from)
      expect(restored.route).toBe(restored.to)
      for (const context of [captured, restored]) {
        expect(context.from.params.segments).not.toBe(from.params.segments)
        expect(context.from.query.tag).not.toBe(from.query.tag)
        expect(context.to.params.segments).not.toBe(to.params.segments)
        expect(context.to.query.tag).not.toBe(to.query.tag)
        expect(() =>
          (context.from.params.segments as string[]).push('callback')
        ).toThrow(TypeError)
        expect(() =>
          (context.from.query.tag as (string | null)[]).push('callback')
        ).toThrow(TypeError)
        expect(() =>
          (context.to.params.segments as string[]).push('callback')
        ).toThrow(TypeError)
        expect(() =>
          (context.to.query.tag as (string | null)[]).push('callback')
        ).toThrow(TypeError)
      }
      expect(from.params.segments).toEqual(['a', 'b'])
      expect(from.query.tag).toEqual(['x', null])
      expect(to.params.segments).toEqual(['c', 'd'])
      expect(to.query.tag).toEqual(['z', ''])
      ;(from.params.segments as string[]).reverse()
      ;(from.query.tag as (string | null)[]).reverse()
      ;(to.params.segments as string[]).push('live')
      ;(to.query.tag as (string | null)[]).push('live')
      await s.push('/a')
      for (const context of [captured, restored]) {
        expect(context.from.params.segments).toEqual(['a', 'b'])
        expect(context.from.query.tag).toEqual(['x', null])
        expect(context.to.params.segments).toEqual(['c', 'd'])
        expect(context.to.query.tag).toEqual(['z', ''])
      }
    })

    it('keeps retained and delayed manual contexts stable across live changes and later navigations', async () => {
      const s = await setup({ manual: true })
      await s.push('/parts/a/b?tag=x&tag')
      const live = s.router.currentRoute.value
      ;(live.params.segments as string[]).push('before-ready')
      ;(live.query.tag as (string | null)[]).push('before-ready')
      expect(s.restores).toHaveLength(0)
      s.scroll()
      const saved = s.restores.at(-1)!
      expect(saved.to.params.segments).toEqual(['a', 'b'])
      expect(saved.to.query.tag).toEqual(['x', null])
      expect(() =>
        (saved.to.query.tag as (string | null)[]).push('callback')
      ).toThrow(TypeError)
      expect(live.query.tag).toEqual(['x', null, 'before-ready'])
      await s.push('/parts/c/d?tag=y&tag=')
      s.scroll()
      const next = s.restores.at(-1)!
      expect(next.to.params.segments).toEqual(['c', 'd'])
      expect(next.to.query.tag).toEqual(['y', ''])
      expect(saved.to.params.segments).toEqual(['a', 'b'])
      expect(saved.to.query.tag).toEqual(['x', null])
      expect(saved).not.toBe(next)
    })

    it('keeps array snapshots independent between simultaneous router instances', async () => {
      const a = await setup({ manual: true })
      const b = await setup({ manual: true })
      await a.push('/parts/a/b?tag=x&tag')
      await b.push('/parts/a/b?tag=x&tag')
      a.scroll()
      b.scroll()
      const first = a.restores.at(-1)!
      const second = b.restores.at(-1)!
      expect(first.to.params.segments).not.toBe(second.to.params.segments)
      expect(first.to.query.tag).not.toBe(second.to.query.tag)
      ;(a.router.currentRoute.value.params.segments as string[]).push('a-only')
      ;(a.router.currentRoute.value.query.tag as (string | null)[]).push(
        'a-only'
      )
      expect(b.router.currentRoute.value.params.segments).toEqual(['a', 'b'])
      expect(b.router.currentRoute.value.query.tag).toEqual(['x', null])
      a.wrapper.unmount()
      await b.push('/b')
      for (const context of [first, second]) {
        expect(context.to.params.segments).toEqual(['a', 'b'])
        expect(context.to.query.tag).toEqual(['x', null])
      }
    })

    it('preserves the departing position on replace and follows redirects', async () => {
      const s = await setup()
      await s.push('/a')
      s.router.beforeEach(to => (to.path === '/redirect' ? '/c' : undefined))
      await s.router.replace('/redirect')
      await flushPromises()
      expect(s.captures.at(-1)).toMatchObject({
        type: 'replace',
        historyPosition: 1,
        route: { path: '/a' },
      })
      expect(s.restores.at(-1)).toMatchObject({
        type: 'replace',
        historyPosition: 1,
        from: { path: '/a' },
        to: { path: '/c' },
      })
      await s.go(-1)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        historyPosition: 0,
      })
    })

    it('does not let aborted, duplicated or superseded navigations change context', async () => {
      const s = await setup()
      await s.push('/a')
      let release!: () => void
      let entered!: () => void
      const started = new Promise<void>(resolve => {
        entered = resolve
      })
      const pending = new Promise<void>(resolve => {
        release = resolve
      })
      s.router.beforeEach(to => {
        if (to.path === '/blocked') return false
        if (to.path === '/slow') {
          entered()
          return pending
        }
        return undefined
      })
      const counts = [s.captures.length, s.restores.length]
      await s.push('/blocked')
      await s.push('/a')
      expect([s.captures.length, s.restores.length]).toEqual(counts)
      const slow = s.router.push('/slow')
      await started
      await s.push('/b')
      release()
      await slow
      await flushPromises()
      expect(s.restores.at(-1)).toMatchObject({
        type: 'push',
        from: { path: '/a' },
        to: { path: '/b' },
        historyPosition: 2,
      })
      expect(s.restores.some(c => c.to.path === '/slow')).toBe(false)
      await s.go(-1)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        direction: 'back',
        historyPosition: 1,
      })
    })

    it('retains navigation context for manual restoration and stops capture on unmount', async () => {
      const s = await setup({ manual: true })
      await s.push('/a')
      s.setTop(123)
      await s.push('/b')
      s.setTop(456)
      await s.go(-1)
      expect(s.restores).toHaveLength(0)
      s.scroll()
      expect(s.top()).toBe(123)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        historyPosition: 1,
      })
      const n = s.captures.length
      s.wrapper.unmount()
      window.dispatchEvent(new Event('pagehide'))
      document.dispatchEvent(new Event('click'))
      expect(s.captures).toHaveLength(n)
    })

    it('supports mounting after initial navigation and custom capture triggers', async () => {
      let capture!: () => void
      const s = await setup({
        beforeMount: true,
        manual: true,
        setupListeners(fn) {
          capture = fn
        },
      })
      s.scroll()
      expect(s.restores.at(-1)).toMatchObject({
        type: 'initial',
        historyPosition: 0,
        to: { path: '/a' },
      })
      await s.push('/b')
      expect(s.captures).toHaveLength(0)
      capture()
      expect(s.captures.at(-1)).toMatchObject({
        historyPosition: 1,
        route: { path: '/b' },
      })
    })

    it('uses built-in memory positions rather than user state, and does not expose it', async () => {
      const s = await setup()
      await s.router.push({
        path: '/a',
        state: { position: 900, secret: 'private-state' },
      })
      await flushPromises()
      expect(s.restores.at(-1)?.historyPosition).toBe(1)
      expect(JSON.stringify(s.restores.at(-1))).not.toContain('private-state')
    })

    it('reports unknown positions for custom histories instead of guessing from state', async () => {
      const original = createMemoryHistory()
      const history: RouterHistory = {
        ...original,
        get location() {
          return original.location
        },
        get state() {
          return { ...original.state, position: 900 }
        },
      }
      const s = await setup({ history })
      await s.push('/a')
      expect(s.restores.at(-1)?.historyPosition).toBeUndefined()
      expect(s.restores.at(-1)?.type).toBe('push')
    })

    it('keeps failed traversals and thrown guards out of the next navigation', async () => {
      const s = await setup()
      await s.push('/a')
      s.setTop(100)
      await s.push('/b')
      const counts = [s.captures.length, s.restores.length]
      const stop = s.router.beforeEach(to =>
        to.path === '/a' ? false : undefined
      )
      await s.go(-1)
      expect(s.router.currentRoute.value.path).toBe('/b')
      expect([s.captures.length, s.restores.length]).toEqual(counts)
      stop()
      const onError = vi.fn()
      s.router.onError(onError)
      const error = new Error('guard failed')
      s.router.beforeEach(to => {
        if (to.path === '/blocked') throw error
      })
      await expect(s.router.push('/blocked')).rejects.toBe(error)
      expect(onError).toHaveBeenCalledOnce()
      expect([s.captures.length, s.restores.length]).toEqual(counts)
      await s.go(-1)
      expect(s.top()).toBe(100)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        direction: 'back',
        delta: -1,
        historyPosition: 1,
      })
    })

    it('does not transfer a pending pop type or direction to a winning push', async () => {
      const s = await setup()
      await s.push('/a')
      await s.push('/b')
      let release!: () => void
      let entered!: () => void
      const started = new Promise<void>(resolve => {
        entered = resolve
      })
      const pending = new Promise<void>(resolve => {
        release = resolve
      })
      const stop = s.router.beforeEach(to => {
        if (to.path === '/a') {
          entered()
          return pending
        }
        return undefined
      })
      s.router.back()
      await started
      await s.push('/c')
      const current = s.restores.at(-1)
      release()
      await flushPromises()
      expect(s.restores.at(-1)).toBe(current)
      expect(current).toMatchObject({
        type: 'push',
        direction: '',
        delta: 0,
        from: { path: '/b' },
        to: { path: '/c' },
      })
      stop()
      await s.go(-1)
      expect(s.restores.at(-1)).toMatchObject({
        type: 'pop',
        direction: 'back',
        historyPosition: 1,
      })
    })
  }
)
