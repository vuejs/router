/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import {
  defineComponent,
  KeepAlive,
  onBeforeUpdate,
  ref,
  useTemplateRef,
} from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import type { RouteRecordRaw } from '../types'
import type { ScrollRestorationPluginOptions } from './scroll-restoration'
import {
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
  ScrollRestoration,
  useScrollRestoration,
} from './scroll-restoration'
import { mockWarn } from '../../__tests__/vitest-mock-warn'

const Root = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
})

const EmptyPage = defineComponent({ template: '<main />' })
const NeutralPage = defineComponent({ template: '<main>Neutral page</main>' })

function mockWindowScroll() {
  let left = 0
  let top = 0

  vi.spyOn(window, 'scrollTo').mockImplementation(
    (optionsOrLeft?: ScrollToOptions | number, newTop?: number) => {
      if (typeof optionsOrLeft === 'number') {
        left = optionsOrLeft
        top = newTop ?? top
      } else {
        left = optionsOrLeft?.left ?? left
        top = optionsOrLeft?.top ?? top
      }
    }
  )

  vi.spyOn(window, 'scrollX', 'get').mockImplementation(() => left)
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => top)

  return (newLeft: number, newTop: number) => {
    left = newLeft
    top = newTop
  }
}

interface MountRouterOptions extends Partial<ScrollRestorationPluginOptions> {
  root?: typeof Root
  // mount the app after this initial navigation
  initialPath?: string
}

async function mountRouter(
  routes: RouteRecordRaw[],
  {
    root = Root,
    storageKeyPrefix,
    initialPath,
    capture = SCROLL_RESTORATION_CAPTURE_DEFAULT,
    restore = SCROLL_RESTORATION_RESTORE_DEFAULT,
  }: MountRouterOptions = {}
) {
  const setScroll = mockWindowScroll()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: EmptyPage },
      { path: '/neutral', component: NeutralPage },
      ...routes,
    ],
  })

  if (initialPath) {
    await router.push(initialPath)
    await router.isReady()
  }

  const wrapper = mount(root, {
    global: {
      plugins: [
        [
          ScrollRestoration,
          {
            router,
            ...(storageKeyPrefix && { storageKeyPrefix }),
            capture,
            restore,
          },
        ],
        router,
      ],
    },
  })

  async function navigate(path: string) {
    await router.push(path)
    await flushPromises()
  }

  return { navigate, router, setScroll, wrapper }
}

afterEach(() => {
  // Restore the sessionStorage getter before clearing it.
  vi.restoreAllMocks()
  sessionStorage.clear()
})
enableAutoUnmount(afterEach)

describe('useScrollRestoration', () => {
  mockWarn()

  it('preserves the saved root position on initial navigation', async () => {
    const savedPosition = JSON.stringify({ default: { left: 0, top: 123 } })
    sessionStorage.setItem('vue:scroll:/', savedPosition)
    const ScrollRoot = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration()
      },
      template: '<RouterView />',
    })
    const { router } = await mountRouter([], { root: ScrollRoot })

    await router.isReady()
    expect(sessionStorage.getItem('vue:scroll:/')).toBe(savedPosition)
  })

  it('reports a missing plugin with the intended error', () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration()
      },
      template: '<main />',
    })

    expect(() => mount(Page)).toThrow(
      'useScrollRestoration() requires installing the ScrollRestoration plugin'
    )
  })

  it('scrolls to a custom position on a new page without a saved entry', async () => {
    const NewPage = defineComponent({
      setup() {
        useScrollRestoration()
      },
      template: '<main>New page</main>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter(
      [{ path: '/new-page', component: NewPage }],
      {
        restore: entry => window.scrollTo(0, entry?.default?.top ?? 135),
      }
    )

    await navigate('/neutral')
    setScroll(0, 40)
    await navigate('/new-page')

    expect(wrapper.text()).toBe('New page')
    expect(window.scrollY).toBe(135)
  })

  it('shares a scroll position between pages with the same key', async () => {
    const PageA = defineComponent({
      setup() {
        useScrollRestoration({ key: 'shared-pages' })
      },
      template: '<main>Page A</main>',
    })
    const PageB = defineComponent({
      setup() {
        useScrollRestoration({ key: 'shared-pages' })
      },
      template: '<main>Page B</main>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
      { path: '/a', component: PageA },
      { path: '/b', component: PageB },
    ])

    await navigate('/a')
    setScroll(40, 120)

    await navigate('/neutral')
    setScroll(0, 0)

    expect(wrapper.text()).toBe('Neutral page')
    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 0,
      top: 0,
    })

    await navigate('/b')

    expect(wrapper.text()).toBe('Page B')
    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 40,
      top: 120,
    })
  })

  it('restores every active call with the same key', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration({ key: 'nested-pages' })
      },
      template: '<main>Parent<RouterView /></main>',
    })
    const Child = defineComponent({
      setup() {
        return useScrollRestoration({ key: 'nested-pages', manual: true })
      },
      template: '<section>Child</section>',
    })
    const { navigate, setScroll } = await mountRouter([
      {
        path: '/parent',
        component: Parent,
        children: [
          { path: 'a', component: Child },
          { path: 'b', component: Child },
        ],
      },
    ])

    await navigate('/parent/a')
    setScroll(30, 90)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/parent/b')

    // a nested manual call doesn't prevent the parent from restoring
    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 30,
      top: 90,
    })
  })

  it('warns when active calls share a key with different capture or restore', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration({
          key: 'same-key',
          capture: () => ({ default: { left: 0, top: 10 } }),
        })
      },
      template: '<main>Parent<RouterView /></main>',
    })
    const Child = defineComponent({
      setup() {
        useScrollRestoration({
          key: 'same-key',
          capture: () => ({ default: { left: 0, top: 90 } }),
        })
      },
      template: '<section>Child</section>',
    })
    const { navigate, setScroll } = await mountRouter([
      {
        path: '/same-key',
        component: Parent,
        children: [
          { path: 'a', component: Child },
          { path: 'b', component: Child },
        ],
      },
    ])

    await navigate('/same-key/a')
    await navigate('/neutral')
    expect('VUE_ROUTER_R0043').toHaveBeenWarned()

    setScroll(0, 0)
    await navigate('/same-key/b')
    // the last capture wins
    expect(window.scrollY).toBe(90)
  })

  it('shares a parent position with a nested call using the same key', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration({ key: 'parent-page' })
      },
      template: '<main>Parent content<RouterView /></main>',
    })
    const Child = defineComponent({
      setup() {
        useScrollRestoration({ key: 'parent-page' })
      },
      template: '<section>Child content</section>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
      {
        path: '/parent',
        component: Parent,
        children: [{ path: 'child', component: Child }],
      },
    ])

    await navigate('/parent')
    setScroll(20, 80)

    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/parent/child')

    expect(wrapper.text()).toContain('Child content')
    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 20,
      top: 80,
    })
  })

  it('shares a nested position with a parent call using the same key', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration({ key: 'nested-owner' })
      },
      template: '<main>Parent<RouterView /></main>',
    })
    const Child = defineComponent({
      setup() {
        useScrollRestoration({ key: 'nested-owner' })
      },
      template: '<section>Child</section>',
    })
    const { navigate, setScroll } = await mountRouter([
      {
        path: '/nested-owner',
        component: Parent,
        children: [{ path: 'child', component: Child }],
      },
    ])

    await navigate('/nested-owner/child')
    setScroll(0, 95)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/nested-owner')

    expect(window.scrollY).toBe(95)
  })

  it('restores nested calls with different keys independently', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        const scroller = useTemplateRef<HTMLElement>('parent-scroller')
        useScrollRestoration({
          key: 'parent-key',
          capture: () => ({ default: { top: scroller.value!.scrollTop } }),
          restore: entry => {
            scroller.value!.scrollTop = entry?.default?.top!
          },
        })
      },
      template: `
        <main>
          <div ref="parent-scroller" data-testid="parent-scroller" />
          <RouterView />
        </main>
      `,
    })
    const Child = defineComponent({
      setup() {
        const scroller = useTemplateRef<HTMLElement>('child-scroller')
        useScrollRestoration({
          key: 'child-key',
          capture: () => ({ default: { top: scroller.value!.scrollTop } }),
          restore: entry => {
            scroller.value!.scrollTop = entry?.default?.top!
          },
        })
      },
      template: '<div ref="child-scroller" data-testid="child-scroller" />',
    })
    const { navigate, wrapper } = await mountRouter([
      {
        path: '/different-keys',
        component: Parent,
        children: [
          { path: 'a', component: Child },
          { path: 'b', component: Child },
        ],
      },
    ])

    await navigate('/different-keys/a')
    wrapper.get('[data-testid="parent-scroller"]').element.scrollTop = 35
    wrapper.get('[data-testid="child-scroller"]').element.scrollTop = 75
    await navigate('/neutral')
    await navigate('/different-keys/b')

    expect(
      wrapper.get('[data-testid="parent-scroller"]').element.scrollTop
    ).toBe(35)
    expect(
      wrapper.get('[data-testid="child-scroller"]').element.scrollTop
    ).toBe(75)
  })

  it('uses path and hash but not query for the default key', async () => {
    const Search = defineComponent({
      setup() {
        useScrollRestoration()
      },
      template: '<main>Search</main>',
    })
    const { navigate, setScroll } = await mountRouter([
      { path: '/search', component: Search },
    ])

    await navigate('/search?q=shoes')
    setScroll(10, 70)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/search?q=shirts')

    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 10,
      top: 70,
    })

    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/search?q=shirts#details')

    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 0,
      top: 0,
    })
  })

  it('captures and restores multiple named positions', async () => {
    const Page = defineComponent({
      setup() {
        const first = useTemplateRef<HTMLElement>('first')
        const second = useTemplateRef<HTMLElement>('second')

        useScrollRestoration({
          key: 'multiple',
          capture: () => ({
            first: { top: first.value!.scrollTop },
            second: { top: second.value!.scrollTop },
          }),
          restore: entry => {
            first.value!.scrollTop = entry?.first?.top!
            second.value!.scrollTop = entry?.second?.top!
          },
        })
      },
      template: `
        <main>
          <div ref="first" data-testid="first" />
          <div ref="second" data-testid="second" />
        </main>
      `,
    })
    const { navigate, wrapper } = await mountRouter([
      { path: '/multiple', component: Page },
    ])

    await navigate('/multiple')
    wrapper.get('[data-testid="first"]').element.scrollTop = 30
    wrapper.get('[data-testid="second"]').element.scrollTop = 90
    await navigate('/neutral')
    await navigate('/multiple')

    expect(wrapper.get('[data-testid="first"]').element.scrollTop).toBe(30)
    expect(wrapper.get('[data-testid="second"]').element.scrollTop).toBe(90)
  })

  it('isolates entries with storageKeyPrefix', async () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration()
      },
      template: '<main>Page</main>',
    })
    const { navigate, setScroll } = await mountRouter(
      [{ path: '/prefixed', component: Page }],
      { storageKeyPrefix: 'custom-scroll:' }
    )

    await navigate('/prefixed')
    setScroll(0, 40)
    await navigate('/neutral')

    expect(sessionStorage.getItem('custom-scroll:/prefixed')).not.toBeNull()
    expect(sessionStorage.getItem('vue:scroll:/prefixed')).toBeNull()
  })

  it('restores once when a reused component updates', async () => {
    const ReusedPage = defineComponent({
      setup() {
        const updates = ref(0)
        onBeforeUpdate(() => window.scrollTo(0, 0))
        useScrollRestoration({ key: 'reused' })
        return { updates }
      },
      template: `
        <main>
          {{ $route.params.id }}
          <button data-testid="update" @click="updates++">Update</button>
        </main>
      `,
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
      { path: '/reused/:id', component: ReusedPage },
    ])

    await navigate('/reused/one')
    setScroll(0, 60)
    await navigate('/reused/two')

    expect(wrapper.text()).toContain('two')
    expect(window.scrollY).toBe(60)

    setScroll(0, 15)
    await wrapper.get('[data-testid="update"]').trigger('click')
    expect(window.scrollY).toBe(15)
  })

  it('does not restore when a kept component updates after navigation', async () => {
    const Sidebar = defineComponent({
      setup() {
        const clicks = ref(0)
        useScrollRestoration({ key: 'kept-parent' })
        return { clicks }
      },
      template:
        '<button data-testid="update" @click="clicks++">{{ clicks }}</button>',
    })
    const Parent = defineComponent({
      components: { RouterView, Sidebar },
      template: '<main><Sidebar /><RouterView /></main>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
      {
        path: '/kept-parent',
        component: Parent,
        children: [
          { path: 'a', component: EmptyPage },
          { path: 'b', component: EmptyPage },
        ],
      },
    ])

    await navigate('/kept-parent/a')
    setScroll(0, 50)
    await navigate('/kept-parent/b')
    setScroll(0, 10)
    await wrapper.get('[data-testid="update"]').trigger('click')

    expect(window.scrollY).toBe(10)
  })

  it('restores the initial navigation when mounted after it', async () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration({ key: 'initial' })
      },
      template: '<main>Page</main>',
    })
    const routes = [{ path: '/initial', component: Page }]
    const first = await mountRouter(routes)
    await first.navigate('/initial')
    first.setScroll(0, 70)
    // reload
    window.dispatchEvent(new Event('pagehide'))
    first.wrapper.unmount()
    vi.restoreAllMocks()

    const { wrapper } = await mountRouter(routes, { initialPath: '/initial' })
    await flushPromises()

    expect(wrapper.text()).toBe('Page')
    expect(window.scrollY).toBe(70)
  })

  it('restores the initial navigation at the root when mounted after it', async () => {
    const ScrollRoot = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration()
      },
      template: '<RouterView />',
    })
    const routes = [{ path: '/initial', component: EmptyPage }]
    const first = await mountRouter(routes, { root: ScrollRoot })
    await first.navigate('/initial')
    first.setScroll(0, 85)
    // reload
    window.dispatchEvent(new Event('pagehide'))
    first.wrapper.unmount()
    vi.restoreAllMocks()

    await mountRouter(routes, { root: ScrollRoot, initialPath: '/initial' })
    await flushPromises()

    expect(window.scrollY).toBe(85)
  })

  it('removes the saved entry when capture returns null', async () => {
    let shouldCapture = true
    const Page = defineComponent({
      setup() {
        useScrollRestoration({
          key: 'nullable',
          capture: () =>
            shouldCapture
              ? { default: { left: window.scrollX, top: window.scrollY } }
              : null,
        })
      },
      template: '<main>Page</main>',
    })
    const { navigate, setScroll } = await mountRouter([
      { path: '/nullable', component: Page },
    ])

    await navigate('/nullable')
    setScroll(0, 80)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/nullable')
    expect(window.scrollY).toBe(80)

    shouldCapture = false
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/nullable')

    expect(window.scrollY).toBe(0)
  })

  it('restores the current route on clicks without deleting its saved entry', async () => {
    const ManualPage = defineComponent({
      setup() {
        return useScrollRestoration({ manual: true })
      },
      template:
        '<button data-testid="restore" @click="scroll">Restore</button>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
      { path: '/kept-entry', component: ManualPage },
    ])

    await navigate('/kept-entry')
    setScroll(0, 65)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/kept-entry')

    expect(window.scrollY).toBe(0)
    await wrapper.get('[data-testid="restore"]').trigger('click')
    expect(window.scrollY).toBe(65)
    setScroll(0, 0)
    await wrapper.get('[data-testid="restore"]').trigger('click')
    expect(window.scrollY).toBe(65)
  })

  it('resolves manual when restoration runs', async () => {
    const manual = ref(true)
    const KeepAliveRoot = defineComponent({
      components: { KeepAlive, RouterView },
      template: `
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      `,
    })
    const Page = defineComponent({
      setup() {
        useScrollRestoration({
          key: 'reactive-manual',
          manual: () => manual.value,
        })
      },
      template: '<main>Page</main>',
    })
    const { navigate, setScroll } = await mountRouter(
      [{ path: '/reactive-manual', component: Page }],
      { root: KeepAliveRoot }
    )

    await navigate('/reactive-manual')
    setScroll(0, 75)
    await navigate('/neutral')
    setScroll(0, 0)
    manual.value = false
    await navigate('/reactive-manual')

    expect(window.scrollY).toBe(75)
  })

  it('captures and restores a reactivated KeepAlive component', async () => {
    const KeepAliveRoot = defineComponent({
      components: { KeepAlive, RouterView },
      template: `
        <RouterView v-slot="{ Component }">
          <KeepAlive>
            <component :is="Component" />
          </KeepAlive>
        </RouterView>
      `,
    })
    const KeptPage = defineComponent({
      setup() {
        useScrollRestoration({ key: 'kept' })
      },
      template: '<main>Kept page</main>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter(
      [{ path: '/kept', component: KeptPage }],
      { root: KeepAliveRoot }
    )

    await navigate('/kept')
    setScroll(0, 110)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/kept')

    expect(wrapper.text()).toBe('Kept page')
    expect(window.scrollY).toBe(110)
  })

  it('keeps the current owner after a failed navigation', async () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration({ key: 'failed-navigation' })
      },
      template: '<main>Page</main>',
    })
    const { navigate, router, setScroll } = await mountRouter([
      { path: '/failure', component: Page },
    ])

    await navigate('/failure')
    setScroll(0, 20)
    const removeGuard = router.beforeResolve(() => false)
    await navigate('/neutral')
    removeGuard()

    setScroll(0, 45)
    await navigate('/neutral')
    setScroll(0, 0)
    await navigate('/failure')

    expect(window.scrollY).toBe(45)
  })

  it('ignores malformed sessionStorage entries', async () => {
    const Page = defineComponent({
      setup() {
        useScrollRestoration({ key: 'malformed' })
      },
      template: '<main>Page</main>',
    })

    for (const malformed of ['{', '42', 'null', '[]', '"text"']) {
      sessionStorage.setItem('test:malformed', malformed)
      const { navigate, setScroll, wrapper } = await mountRouter(
        [{ path: '/malformed', component: Page }],
        { storageKeyPrefix: 'test:' }
      )

      setScroll(0, 0)
      await navigate('/malformed')
      expect(wrapper.text()).toBe('Page')
      expect(window.scrollY).toBe(0)

      // replaced by the next capture
      setScroll(0, 40)
      await navigate('/neutral')
      setScroll(0, 0)
      await navigate('/malformed')
      expect(window.scrollY).toBe(40)

      wrapper.unmount()
      vi.restoreAllMocks()
    }
  })

  it('ignores unavailable sessionStorage', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    const Page = defineComponent({
      setup() {
        useScrollRestoration()
      },
      template: '<main>Page</main>',
    })

    const { navigate, wrapper } = await mountRouter([
      { path: '/unavailable', component: Page },
    ])
    await navigate('/unavailable')

    expect(wrapper.text()).toBe('Page')
  })
})
