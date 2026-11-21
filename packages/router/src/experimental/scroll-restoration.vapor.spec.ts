/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import type * as Vue from 'vue'
import { defineComponent } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { createRouter } from '../router'
import {
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
  ScrollRestoration,
  useScrollRestoration,
} from './scroll-restoration'
import { mockWarn } from '../../__tests__/vitest-mock-warn'

// vapor components have no `getCurrentInstance()` while their lifecycle hooks
// still run. The flag is only enabled around the calls that emulate them
const vapor = vi.hoisted(() => ({ active: false }))
vi.mock('vue', async importOriginal => {
  const vue = await importOriginal<typeof Vue>()
  return {
    ...vue,
    getCurrentInstance: () => (vapor.active ? null : vue.getCurrentInstance()),
  }
})

function withoutInstance<T>(fn: () => T): T {
  vapor.active = true
  try {
    return fn()
  } finally {
    vapor.active = false
  }
}

const Root = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
})

const VaporPage = defineComponent({
  setup() {
    withoutInstance(() => useScrollRestoration())
  },
  template: '<main>Page</main>',
})

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

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})
enableAutoUnmount(afterEach)

describe('useScrollRestoration without a component instance', () => {
  mockWarn()

  it('captures and restores the page', async () => {
    const setScroll = mockWindowScroll()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: NeutralPage },
        { path: '/neutral', component: NeutralPage },
        { path: '/page', component: VaporPage },
      ],
    })
    mount(Root, {
      global: {
        plugins: [
          [
            ScrollRestoration,
            {
              router,
              capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
              restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
            },
          ],
          router,
        ],
      },
    })

    await router.push('/page')
    await flushPromises()
    setScroll(0, 75)
    await router.push('/neutral')
    await flushPromises()
    expect(JSON.parse(sessionStorage.getItem('vue:scroll:/page')!)).toEqual({
      default: { left: 0, top: 75 },
    })

    setScroll(0, 10)
    await router.push('/page')
    await flushPromises()
    expect(window.scrollY).toBe(75)
  })
})
