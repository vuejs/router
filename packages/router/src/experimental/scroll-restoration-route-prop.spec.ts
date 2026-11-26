/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from 'vitest'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import {
  computed,
  defineComponent,
  h,
  KeepAlive,
  ref,
  type Component,
} from 'vue'
import { createRouter } from '../router'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { useRoute } from '../useApi'
import { START_LOCATION_NORMALIZED } from '../location'
import { experimental_createRouter, normalizeRouteRecord } from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import { MatcherPatternPathStatic } from './route-resolver/matchers/matcher-pattern'
import {
  ScrollRestoration,
  useScrollRestoration,
  type ScrollRestorationContext,
  type ScrollRestorationPluginOptions,
} from './scroll-restoration'

enableAutoUnmount(afterEach)
afterEach(() => sessionStorage.clear())

describe.each(['classic', 'experimental'] as const)(
  '%s displayed-route restoration',
  kind => {
    function makeRouter(pages: Record<string, Component>, initial = '/a') {
      const history = createMemoryHistory()
      history.replace(initial)
      return kind === 'classic'
        ? createRouter({
            history,
            routes: Object.entries(pages).map(([path, component]) => ({
              path,
              component,
            })),
          })
        : experimental_createRouter({
            history,
            resolver: createFixedResolver(
              Object.entries(pages).map(([path, component]) =>
                normalizeRouteRecord({
                  name: path,
                  path: new MatcherPatternPathStatic(path),
                  components: { default: component },
                })
              )
            ),
          })
    }

    for (const host of kind === 'classic'
      ? ['normal', 'resolved-current', 'background']
      : ['normal', 'resolved-current']) {
      it(`restores the public ${host} RouterView route`, async () => {
        const restored: string[] = []
        const contexts: ScrollRestorationContext[] = []
        let scroll!: () => void
        const Page = defineComponent({
          setup() {
            const route = useRoute()
            ;({ scroll } = useScrollRestoration())
            return () => h('main', route.path)
          },
        })
        const router = makeRouter({ '/a': Page, '/b': Page, '/c': Page }, '/b')
        const Root = defineComponent({
          components: { RouterView },
          setup() {
            const displayed = computed(() =>
              host !== 'background' &&
              router.currentRoute.value === START_LOCATION_NORMALIZED
                ? undefined
                : router.resolve(
                    host === 'background'
                      ? '/a'
                      : router.currentRoute.value.fullPath
                  )
            )
            return { displayed }
          },
          template:
            host === 'normal'
              ? '<RouterView />'
              : '<RouterView :route="displayed" />',
        })
        const wrapper = mount(Root, {
          global: {
            plugins: [
              [
                ScrollRestoration,
                {
                  router,
                  capture: () => null,
                  restore(_entry, to, context) {
                    restored.push(to.path)
                    contexts.push(context)
                  },
                } satisfies ScrollRestorationPluginOptions,
              ],
              router,
            ],
          },
        })
        await router.isReady()
        await flushPromises()
        const path = host === 'background' ? '/a' : '/b'
        expect(wrapper.find('main').text()).toBe(path)
        expect(restored).toEqual([path])
        expect(contexts.at(-1)).toMatchObject({
          type: 'initial',
          route: { path },
          to: { path: '/b' },
          historyPosition: host === 'background' ? undefined : 0,
        })
        await router.push('/c')
        await flushPromises()
        const next = host === 'background' ? '/a' : '/c'
        expect(wrapper.find('main').text()).toBe(next)
        if (host === 'background') {
          // No displayed-route change, so there is no automatic restoration.
          expect(restored).toEqual([path])
          scroll()
        }
        expect(restored).toEqual([path, next])
        expect(contexts.at(-1)).toMatchObject({
          type: 'push',
          delta: 0,
          direction: '',
          route: { path: next },
          from: { path: '/b' },
          to: { path: '/c' },
          historyPosition: host === 'background' ? undefined : 1,
        })
      })
    }

    if (kind === 'classic') {
      it('waits for a successful startup before restoring an already rendered background view', async () => {
        let scroll!: () => void
        const contexts: ScrollRestorationContext[] = []
        const Page = defineComponent({
          setup() {
            ;({ scroll } = useScrollRestoration())
            return () => h('main', 'background')
          },
        })
        const router = makeRouter({ '/a': Page, '/b': Page }, '/b')
        const removeGuard = router.beforeEach(() => false)
        const background = router.resolve('/a')
        const wrapper = mount(
          defineComponent({
            components: { RouterView },
            setup: () => ({ background }),
            template: '<RouterView :route="background" />',
          }),
          {
            global: {
              plugins: [
                [
                  ScrollRestoration,
                  {
                    router,
                    capture: () => null,
                    restore: (_entry, _to, context) => contexts.push(context),
                  } satisfies ScrollRestorationPluginOptions,
                ],
                router,
              ],
            },
          }
        )
        const failure = await router.isReady().catch(error => error)
        await flushPromises()
        expect(failure.type).toBe(4)
        expect(router.currentRoute.value).toBe(START_LOCATION_NORMALIZED)
        expect(wrapper.find('main').text()).toBe('background')
        scroll()
        expect(contexts).toEqual([])
        removeGuard()
        await router.push('/b')
        await flushPromises()
        expect(contexts).toHaveLength(1)
        expect(contexts[0]).toMatchObject({
          type: 'initial',
          route: { path: '/a' },
          from: { path: '/' },
          to: { path: '/b' },
          historyPosition: undefined,
        })
      })
    }

    it('restores a previously visited background route through the public prop', async () => {
      const restored: string[] = []
      let scroll!: () => void
      const Page = defineComponent({
        setup() {
          const route = useRoute()
          ;({ scroll } = useScrollRestoration({ manual: true }))
          return () => h('main', route.path)
        },
      })
      const router = makeRouter({ '/a': Page, '/b': Page })
      // Experimental records are initialized by a real navigation before they
      // are used as background views, as with a page opening a modal.
      await router.push('/a')
      await router.push('/b')
      const background = router.resolve('/a')
      const wrapper = mount(
        defineComponent({
          components: { RouterView },
          setup: () => ({ background }),
          template: '<RouterView :route="background" />',
        }),
        {
          global: {
            plugins: [
              [
                ScrollRestoration,
                {
                  router,
                  capture: () => null,
                  restore: (_entry, to) => restored.push(to.path),
                } satisfies ScrollRestorationPluginOptions,
              ],
              router,
            ],
          },
        }
      )
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('/a')
      scroll()
      expect(restored).toEqual(['/a'])
      wrapper.unmount()
      scroll()
      expect(restored).toEqual(['/a'])
    })

    it('uses the displayed route for manual calls and blocks calls before the next render', async () => {
      let scroll!: () => void
      const contexts: ScrollRestorationContext[] = []
      const Page = defineComponent({
        setup() {
          const route = useRoute()
          ;({ scroll } = useScrollRestoration({ manual: true }))
          return () => h('main', route.path)
        },
      })
      const router = makeRouter({ '/a': Page, '/b': Page })
      const Root = defineComponent({
        components: { RouterView },
        setup() {
          const displayed = computed(() =>
            router.currentRoute.value === START_LOCATION_NORMALIZED
              ? undefined
              : router.resolve(router.currentRoute.value.fullPath)
          )
          return { displayed }
        },
        template: '<RouterView :route="displayed" />',
      })
      const wrapper = mount(Root, {
        global: {
          plugins: [
            [
              ScrollRestoration,
              {
                router,
                capture: () => null,
                restore: (_entry, _to, c) => contexts.push(c),
              } satisfies ScrollRestorationPluginOptions,
            ],
            router,
          ],
        },
      })
      await router.isReady()
      await flushPromises()
      scroll()
      expect(contexts).toHaveLength(1)
      expect(contexts[0]).toMatchObject({
        route: { path: '/a' },
        historyPosition: 0,
      })
      router.afterEach(() => scroll())
      await router.push('/b')
      await flushPromises()
      // The old data-ready callback in afterEach saw the new committed route
      // before RouterView displayed it. It must not restore that entry.
      expect(contexts).toHaveLength(1)
      scroll()
      expect(contexts).toHaveLength(2)
      expect(contexts.at(-1)).toMatchObject({
        type: 'push',
        route: { path: '/b' },
        historyPosition: 1,
      })
      wrapper.unmount()
      scroll()
      expect(contexts).toHaveLength(2)
    })

    it('ignores late data-ready calls from an unmounted page', async () => {
      const pending = Promise.withResolvers<void>()
      const contexts: ScrollRestorationContext[] = []
      let finished!: Promise<void>
      const Page = defineComponent({
        setup() {
          const { scroll } = useScrollRestoration({ manual: true })
          finished = pending.promise.then(scroll)
          return () => h('main', 'old')
        },
      })
      const Other = defineComponent({ setup: () => () => h('main', 'new') })
      const router = makeRouter({ '/a': Page, '/b': Other })
      const wrapper = mount(
        defineComponent({ setup: () => () => h(RouterView) }),
        {
          global: {
            plugins: [
              [
                ScrollRestoration,
                {
                  router,
                  capture: () => null,
                  restore: (_entry, _to, c) => contexts.push(c),
                } satisfies ScrollRestorationPluginOptions,
              ],
              router,
            ],
          },
        }
      )
      await router.isReady()
      await flushPromises()
      await router.push('/b')
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('new')
      pending.resolve()
      await finished
      await flushPromises()
      expect(contexts).toEqual([])
    })

    it('pauses manual calls while deactivated and resumes on KeepAlive activation', async () => {
      let scroll!: () => void
      const restored: string[] = []
      const Page = defineComponent({
        setup() {
          ;({ scroll } = useScrollRestoration({ manual: true }))
          return () => h('main', 'kept')
        },
      })
      const Other = defineComponent({ setup: () => () => h('main', 'other') })
      const router = makeRouter({ '/a': Page, '/b': Other })
      const Root = defineComponent({
        components: { RouterView, KeepAlive },
        template:
          '<RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></RouterView>',
      })
      const wrapper = mount(Root, {
        global: {
          plugins: [
            [
              ScrollRestoration,
              {
                router,
                capture: () => null,
                restore: (_entry, to) => restored.push(to.path),
              } satisfies ScrollRestorationPluginOptions,
            ],
            router,
          ],
        },
      })
      await router.isReady()
      await flushPromises()
      scroll()
      expect(restored).toEqual(['/a'])
      await router.push('/b')
      await flushPromises()
      scroll()
      expect(restored).toEqual(['/a'])
      await router.push('/a')
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('kept')
      scroll()
      expect(restored).toEqual(['/a', '/a'])
    })

    it('rejects old keyed Suspense callbacks even when the next route uses the same component', async () => {
      const pending: Array<PromiseWithResolvers<void>> = []
      const scrolls: Array<() => void> = []
      const updates: Array<() => void> = []
      const restored: string[] = []
      const Async = defineComponent({
        async setup() {
          const route = useRoute()
          const count = ref(0)
          scrolls.push(useScrollRestoration().scroll)
          updates.push(() => count.value++)
          const ready = Promise.withResolvers<void>()
          pending.push(ready)
          await ready.promise
          return () => h('main', route.path + ':' + count.value)
        },
      })
      const router = makeRouter({ '/a': Async, '/b': Async })
      const wrapper = mount(
        defineComponent({
          components: { RouterView },
          template:
            '<RouterView v-slot="{ Component, route }"><Suspense v-if="Component"><component :is="Component" :key="route.fullPath" /></Suspense></RouterView>',
        }),
        {
          global: {
            plugins: [
              [
                ScrollRestoration,
                {
                  router,
                  capture: () => null,
                  restore: (_entry, to) => restored.push(to.path),
                } satisfies ScrollRestorationPluginOptions,
              ],
              router,
            ],
          },
        }
      )
      await router.isReady()
      await flushPromises()
      pending[0].resolve()
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('/a:0')
      expect(restored).toEqual(['/a'])
      await router.push('/b')
      await flushPromises()
      updates[0]()
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('/b:1')
      scrolls[0]()
      expect(restored).toEqual(['/a'])
      pending[1].resolve()
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('/b:0')
      expect(restored).toEqual(['/a', '/b'])
      scrolls[0]()
      expect(restored).toEqual(['/a', '/b'])
      scrolls[1]()
      expect(restored).toEqual(['/a', '/b', '/b'])
    })

    it('keeps pending and abandoned Suspense work from restoring another route', async () => {
      const pending = Promise.withResolvers<void>()
      const restored: string[] = []
      let lateScroll!: () => void
      const Ready = defineComponent({
        setup() {
          useScrollRestoration()
          const route = useRoute()
          return () => h('main', route.path)
        },
      })
      const Slow = defineComponent({
        async setup() {
          ;({ scroll: lateScroll } = useScrollRestoration())
          await pending.promise
          return () => h('main', 'slow')
        },
      })
      const router = makeRouter({ '/a': Ready, '/slow': Slow, '/b': Ready })
      const show = ref(true)
      const Root = defineComponent({
        components: { RouterView },
        setup: () => ({ show }),
        template:
          '<RouterView v-if="show" v-slot="{ Component }"><Suspense v-if="Component"><component :is="Component" /></Suspense></RouterView>',
      })
      const wrapper = mount(Root, {
        global: {
          plugins: [
            [
              ScrollRestoration,
              {
                router,
                capture: () => null,
                restore: (_entry, to) => restored.push(to.path),
              } satisfies ScrollRestorationPluginOptions,
            ],
            router,
          ],
        },
      })
      await router.isReady()
      await flushPromises()
      expect(restored).toEqual(['/a'])
      await router.push('/slow')
      await flushPromises()
      lateScroll()
      expect(restored).toEqual(['/a'])
      await router.push('/b')
      await flushPromises()
      expect(wrapper.find('main').text()).toBe('/b')
      expect(restored).toEqual(['/a', '/b'])
      pending.resolve()
      await flushPromises()
      lateScroll()
      expect(restored).toEqual(['/a', '/b'])
      show.value = false
      await flushPromises()
      lateScroll()
      expect(restored).toEqual(['/a', '/b'])
    })
  }
)
