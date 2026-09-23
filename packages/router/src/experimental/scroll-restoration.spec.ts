/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import type { RouteRecordRaw } from '../types'
import { ScrollRestoration, useScrollRestoration } from './scroll-restoration'

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

async function mountRouter(routes: RouteRecordRaw[]) {
  const setScroll = mockWindowScroll()
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: EmptyPage },
      { path: '/neutral', component: NeutralPage },
      ...routes,
    ],
  })

  const wrapper = mount(Root, {
    global: {
      plugins: [[ScrollRestoration, { router }], router],
    },
  })

  async function navigate(path: string) {
    await router.push(path)
    await flushPromises()
  }

  return { navigate, router, setScroll, wrapper }
}

afterEach(() => {
  sessionStorage.clear()
  vi.restoreAllMocks()
})
enableAutoUnmount(afterEach)

describe('useScrollRestoration', () => {
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

  it('lets a nested manual restoration take precedence over its parent', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        useScrollRestoration({ key: 'nested-pages' })
      },
      template: '<main>Parent<RouterView /></main>',
    })
    const Child = defineComponent({
      setup() {
        return useScrollRestoration({
          key: 'nested-pages',
          manual: true,
        })
      },
      template:
        '<button data-testid="child-scroll" @click="scroll">Restore child</button>',
    })
    const { navigate, setScroll, wrapper } = await mountRouter([
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

    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 0,
      top: 0,
    })

    await wrapper.get('[data-testid="child-scroll"]').trigger('click')

    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 30,
      top: 90,
    })
  })

  it('does not give a parent HTML scroll position to a new nested owner', async () => {
    const Parent = defineComponent({
      components: { RouterView },
      setup() {
        return useScrollRestoration({ key: 'parent-page', manual: true })
      },
      template: `
        <main>
          Parent content
          <button data-testid="parent-scroll" @click="scroll">Restore parent</button>
          <RouterView />
        </main>
      `,
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
      left: 0,
      top: 0,
    })

    await wrapper.get('[data-testid="parent-scroll"]').trigger('click')

    expect({ left: window.scrollX, top: window.scrollY }).toEqual({
      left: 20,
      top: 80,
    })
  })
})
