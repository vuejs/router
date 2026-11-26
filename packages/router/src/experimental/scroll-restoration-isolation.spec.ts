/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, type Component } from 'vue'
import { createRouter } from '../router'
import { createMemoryHistory } from '../history/memory'
import type { RouterHistory } from '../history/common'
import { RouterView } from '../RouterView'
import { START_LOCATION_NORMALIZED } from '../location'
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

type Kind = 'classic' | 'experimental'
function makeRouter(
  kind: Kind,
  Page: Component,
  history = createMemoryHistory()
) {
  const paths = ['/alpha', '/beta', '/blocked', '/tail']
  return kind === 'classic'
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
}

function mountHost(
  router: ReturnType<typeof makeRouter>,
  Root: Component,
  prefix: string
) {
  const captures: ScrollRestorationContext[] = []
  const keys: ScrollRestorationContext[] = []
  const restores: ScrollRestorationContext[] = []
  let capture!: Parameters<
    NonNullable<ScrollRestorationPluginOptions['setupListeners']>
  >[0]
  const wrapper = mount(Root, {
    global: {
      plugins: [
        [
          ScrollRestoration,
          {
            router,
            storageKeyPrefix: prefix,
            setupListeners(fn) {
              capture = fn
            },
            key: (_route, context) => {
              keys.push(context)
              return `entry:${context.historyPosition}`
            },
            capture(context) {
              captures.push(context)
              return null
            },
            restore(_entry, _to, context) {
              restores.push(context)
            },
          } satisfies ScrollRestorationPluginOptions,
        ],
        router,
      ],
    },
  })
  return {
    wrapper,
    captures,
    keys,
    restores,
    capture: (...args: Parameters<typeof capture>) => capture(...args),
  }
}

const Root = defineComponent({ render: () => h(RouterView) })

for (const first of ['classic', 'experimental'] as const) {
  describe.each(['classic', 'experimental'] as const)(
    `${first} then %s router context ownership`,
    second => {
      it('isolates a rejected startup and subsequent interleaved successes', async () => {
        const Page = defineComponent({
          setup() {
            useScrollRestoration({ manual: true })
            return () => h('main', 'page')
          },
        })
        const a = makeRouter(first, Page)
        a.options.history.replace('/alpha?secret=A&secret=AA')
        const appA = mountHost(a, Root, 'isolation:A:')
        await a.isReady()
        await flushPromises()
        appA.capture()
        const retainedA = appA.captures.at(-1)!
        expect(retainedA).toMatchObject({
          route: { path: '/alpha' },
          to: { query: { secret: ['A', 'AA'] } },
          historyPosition: 0,
        })

        const b = makeRouter(second, Page)
        b.options.history.replace('/blocked')
        const stopGuard = b.beforeEach(() => false)
        const Sidebar = defineComponent({
          setup() {
            useScrollRestoration({ manual: true })
            return () => h('aside', 'sidebar')
          },
        })
        const appB = mountHost(
          b,
          defineComponent({ render: () => [h(Sidebar), h(RouterView)] }),
          'isolation:B:'
        )
        const failure = await b.isReady().catch(error => error)
        await flushPromises()
        expect(failure.type).toBe(4)
        expect(b.currentRoute.value).toBe(START_LOCATION_NORMALIZED)
        expect(appB.restores).toEqual([])
        appB.capture()
        expect(appB.captures.at(-1)).toMatchObject({
          type: 'initial',
          delta: 0,
          direction: '',
          historyPosition: undefined,
          route: { path: '/', params: {}, query: {} },
          from: { path: '/', params: {}, query: {} },
          to: { path: '/', params: {}, query: {} },
        })
        expect(appB.keys.at(-1)).toEqual(appB.captures.at(-1))

        stopGuard()
        await b.push('/beta?owner=B&owner=BB')
        await flushPromises()
        appB.capture()
        expect(appB.captures.at(-1)).toMatchObject({
          type: 'initial',
          historyPosition: 0,
          from: { path: '/', query: {} },
          to: { path: '/beta', query: { owner: ['B', 'BB'] } },
        })
        const retainedB = appB.captures.at(-1)!
        await a.push('/tail?secret=nextA')
        await flushPromises()
        appB.capture()
        expect(appB.captures.at(-1)).toBe(retainedB)
        await b.push('/tail?owner=nextB')
        await flushPromises()
        appA.capture()
        appB.capture()
        expect(appA.captures.at(-1)).toMatchObject({
          from: { path: '/alpha' },
          to: {
            path: '/tail',
            query: { secret: first === 'classic' ? 'nextA' : ['nextA'] },
          },
          historyPosition: 1,
        })
        expect(appB.captures.at(-1)).toMatchObject({
          from: { path: '/beta' },
          to: {
            path: '/tail',
            query: { owner: second === 'classic' ? 'nextB' : ['nextB'] },
          },
          historyPosition: 1,
        })
        expect(retainedA.to.query).toEqual({ secret: ['A', 'AA'] })
        expect(retainedB.to.query).toEqual({ owner: ['B', 'BB'] })
        expect(Object.isFrozen(retainedA.to.query.secret)).toBe(true)
        expect(Object.isFrozen(retainedB.to.query.owner)).toBe(true)
        // Distinct storage prefixes do not provide in-memory ownership. Neither
        // keys nor captures for B's own entry may contain A's navigation data.
        for (const context of [...appB.keys, ...appB.captures]) {
          for (const route of [context.route, context.from, context.to]) {
            expect(route.query).not.toHaveProperty('secret')
            expect(route.params).toEqual({})
          }
        }
      })
    }
  )
}

for (const kind of ['classic', 'experimental'] as const) {
  it(`${kind}: does not reuse a previous startup context after the router is unmounted`, async () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration({ manual: true })
        return () => h('main')
      },
    })
    const router = makeRouter(kind, Page)
    router.options.history.replace('/alpha?secret=old')
    const first = mountHost(router, Root, 'restart:first:')
    await router.isReady()
    await flushPromises()
    first.wrapper.unmount()
    expect(router.currentRoute.value).toBe(START_LOCATION_NORMALIZED)
    router.options.history.replace('/blocked')
    router.beforeEach(() => false)
    const Sidebar = defineComponent({
      setup() {
        useScrollRestoration({ manual: true })
        return () => h('aside')
      },
    })
    const next = mountHost(
      router,
      defineComponent({ render: () => [h(Sidebar), h(RouterView)] }),
      'restart:next:'
    )
    const failure = await router.isReady().catch(error => error)
    await flushPromises()
    next.capture()
    expect(failure.type).toBe(4)
    expect(next.captures.at(-1)).toMatchObject({
      route: { path: '/' },
      from: { path: '/' },
      to: { path: '/', query: {} },
      historyPosition: undefined,
    })
    expect(next.restores).toEqual([])
  })
}

it.each([false, true])(
  'uses the owning router context for a foreign displayed object (shared history: %s)',
  async shared => {
    const scrolls: Array<() => void> = []
    const Page = defineComponent({
      setup() {
        scrolls.push(useScrollRestoration({ manual: true }).scroll)
        return () => h('main', 'page')
      },
    })
    const historyA = createMemoryHistory()
    historyA.replace('/alpha?secret=A')
    const a = makeRouter('classic', Page, historyA)
    const appA = mountHost(a, Root, 'foreign:A:')
    await a.isReady()
    await a.push('/tail?secret=AA')
    await flushPromises()
    const foreign = a.currentRoute.value
    const historyB: RouterHistory = shared ? historyA : createMemoryHistory()
    historyB.replace('/beta?owner=B')
    const b = makeRouter('classic', Page, historyB)
    const appB = mountHost(
      b,
      defineComponent({ render: () => h(RouterView, { route: foreign }) }),
      'foreign:B:'
    )
    await b.isReady()
    await flushPromises()
    const scrollB = scrolls.at(-1)!
    scrollB()
    expect(appB.restores.at(-1)).toMatchObject({
      type: 'initial',
      route: { fullPath: '/tail?secret=AA' },
      from: { path: '/', query: {} },
      to: { path: '/beta', query: { owner: 'B' } },
      historyPosition: undefined,
    })
    // The explicit route argument can describe a foreign displayed page; it must
    // never import the other router's from/to, operation or history position.
    appB.capture(foreign)
    expect(appB.captures.at(-1)).toEqual(appB.restores.at(-1))
    await b.push('/alpha?owner=BB')
    await flushPromises()
    scrollB()
    expect(appB.restores.at(-1)).toMatchObject({
      type: 'push',
      delta: 0,
      direction: '',
      route: { path: '/tail' },
      from: { path: '/beta', query: { owner: 'B' } },
      to: { path: '/alpha', query: { owner: 'BB' } },
      historyPosition: undefined,
    })
    appA.capture()
    expect(appA.captures.at(-1)).toMatchObject({
      type: 'push',
      from: { path: '/alpha' },
      to: { path: '/tail', query: { secret: 'AA' } },
      historyPosition: 1,
    })
  }
)

it.each(['classic', 'experimental'] as const)(
  '%s: keeps nonempty params and query snapshots within their router',
  async kind => {
    let scrollB!: () => void
    const PageA = defineComponent({
      setup() {
        useScrollRestoration({ manual: true })
        return () => h('main')
      },
    })
    const PageB = defineComponent({
      setup() {
        scrollB = useScrollRestoration({ manual: true }).scroll
        return () => h('main')
      },
    })
    const a = makeRouter(kind, PageA)
    a.options.history.replace('/parts/A/AA?secret=one&secret=two')
    const appA = mountHost(a, Root, 'params:A:')
    await a.isReady()
    await flushPromises()
    appA.capture()
    expect(appA.captures.at(-1)).toMatchObject({
      to: {
        params: { segments: ['A', 'AA'] },
        query: { secret: ['one', 'two'] },
      },
    })
    const b = makeRouter(kind, PageB)
    b.options.history.replace('/blocked')
    const removeGuard = b.beforeEach(() => false)
    const Sidebar = defineComponent({
      setup() {
        useScrollRestoration({ manual: true })
        return () => h('aside')
      },
    })
    const appB = mountHost(
      b,
      defineComponent({ render: () => [h(Sidebar), h(RouterView)] }),
      'params:B:'
    )
    await b.isReady().catch(() => {})
    await flushPromises()
    appB.capture()
    for (const route of [
      appB.captures.at(-1)!.route,
      appB.captures.at(-1)!.from,
      appB.captures.at(-1)!.to,
    ]) {
      expect(route.params).toEqual({})
      expect(route.query).toEqual({})
    }
    removeGuard()
    await b.push('/parts/B/BB?owner=three&owner=four')
    await flushPromises()
    scrollB()
    const retained = appB.restores.at(-1)!
    expect(retained).toMatchObject({
      type: 'initial',
      from: { path: '/' },
      to: {
        params: { segments: ['B', 'BB'] },
        query: { owner: ['three', 'four'] },
      },
      historyPosition: 0,
    })
    await a.push('/parts/other/A?secret=five')
    await flushPromises()
    scrollB()
    appB.capture()
    expect(appB.restores.at(-1)).toBe(retained)
    expect(appB.captures.at(-1)).toBe(retained)
    expect(retained.to.params.segments).toEqual(['B', 'BB'])
    expect(retained.to.query).toEqual({ owner: ['three', 'four'] })
    expect(Object.isFrozen(retained.to.params.segments)).toBe(true)
  }
)
