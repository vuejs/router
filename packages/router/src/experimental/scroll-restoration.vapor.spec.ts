/**
 * @vitest-environment happy-dom
 */
import { createVaporApp, defineVaporComponent, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../history/memory'
import { createRouter } from '../router'
import type { RouteRecordRaw } from '../types'
import { compileVapor } from '../tests/vapor'
import { mockWarn } from '../../__tests__/vitest-mock-warn'
import {
  SCROLL_RESTORATION_CAPTURE_DEFAULT,
  SCROLL_RESTORATION_RESTORE_DEFAULT,
  ScrollRestoration,
  useScrollRestoration,
  type UseScrollRestorationOptions,
} from './scroll-restoration'
import { RouterView } from './vapor/RouterView'

let app: ReturnType<typeof createVaporApp> | undefined
let host: HTMLElement | undefined

afterEach(() => {
  app?.unmount()
  host?.remove()
  app = host = undefined
  vi.restoreAllMocks()
  sessionStorage.clear()
})

function mockWindowScroll() {
  let top = 0
  vi.spyOn(window, 'scrollTo').mockImplementation(
    (options?: ScrollToOptions | number, y?: number) => {
      top = (typeof options === 'number' ? y : options?.top) ?? top
    }
  )
  vi.spyOn(window, 'scrollX', 'get').mockImplementation(() => 0)
  vi.spyOn(window, 'scrollY', 'get').mockImplementation(() => top)
  return (newTop: number) => (top = newTop)
}

function vaporPage(template: string, options?: UseScrollRestorationOptions) {
  return defineVaporComponent({
    setup() {
      useScrollRestoration(options)
    },
    render: compileVapor(template),
  })
}

async function mountVaporApp(routes: RouteRecordRaw[]) {
  const setScroll = mockWindowScroll()
  const history = createMemoryHistory()
  history.replace('/neutral')
  const router = createRouter({
    history,
    routes: [
      { path: '/neutral', component: vaporPage('<main>Neutral</main>') },
      ...routes,
    ],
  })
  app = createVaporApp(
    defineVaporComponent({ render: compileVapor('<RouterView />') })
  )
  app.component('RouterView', RouterView)
  app.use(ScrollRestoration, {
    router,
    capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
    restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  })
  app.use(router)
  await router.push('/neutral')
  host = document.createElement('div')
  document.body.appendChild(host)
  app.mount(host)

  async function navigate(path: string) {
    await router.push(path)
    await nextTick()
    await nextTick()
  }

  return { navigate, setScroll }
}

describe('useScrollRestoration in Vapor components', () => {
  mockWarn()

  it('restores the saved position of a Vapor page', async () => {
    const { navigate, setScroll } = await mountVaporApp([
      { path: '/page', component: vaporPage('<main>Page</main>') },
    ])

    await navigate('/page')
    setScroll(120)
    await navigate('/neutral')
    setScroll(0)
    await navigate('/page')

    expect(window.scrollY).toBe(120)
  })

  it('lets a nested Vapor call own the key of a Vapor parent call', async () => {
    const Parent = vaporPage('<main>Parent<RouterView /></main>', {
      key: 'same-key',
      capture: () => ({ default: { top: 10 } }),
      restore: () => window.scrollTo({ top: 500 }),
    })
    const Child = vaporPage('<section>Child</section>', {
      key: 'same-key',
      capture: () => ({ default: { top: 90 } }),
    })
    const { navigate, setScroll } = await mountVaporApp([
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
    setScroll(0)
    await navigate('/same-key/b')

    expect(window.scrollY).toBe(90)
    expect('VUE_ROUTER_R0043').not.toHaveBeenWarned()
  })
})
