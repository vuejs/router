/**
 * @vitest-environment happy-dom
 */
import {
  createSSRApp,
  createVaporSSRApp,
  defineVaporComponent,
  nextTick,
} from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from '../src'
import type { RouteRecordRaw } from '../src'
import { VaporRouterLink, VaporRouterView } from '../src/vapor'
import { compileVapor } from './vapor'
import { mockWarn } from './vitest-mock-warn'

// a Vapor SFC: render on the client, ssrRender on the server
const component = (template: string) =>
  defineVaporComponent({
    render: compileVapor(template),
    ssrRender: compileVapor(template, true),
  } as any)

const routes = (): RouteRecordRaw[] => [
  {
    path: '/p',
    component: component('<h1>P</h1><RouterView />'),
    children: [
      { path: 'a', component: component('<p>A</p>') },
      { path: 'b', component: component('<p>B</p>') },
    ],
  },
]

async function createApps(rootTemplate: string) {
  const Root = component(rootTemplate)
  const createAppRouter = () => {
    const history = createMemoryHistory()
    history.replace('/p/a')
    return createRouter({ history, routes: routes() })
  }

  // the server uses the VDOM components that the router registers
  const serverRouter = createAppRouter()
  const serverApp = createSSRApp(Root).use(serverRouter)
  await serverRouter.isReady()
  const html = await renderToString(serverApp)

  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)
  const serverNodes = Array.from(host.querySelectorAll('*'))

  const router = createAppRouter()
  const app = createVaporSSRApp(Root).use(router)
  app.component('RouterView', VaporRouterView)
  app.component('RouterLink', VaporRouterLink)
  await router.isReady()
  app.mount(host)
  unmount = () => {
    app.unmount()
    host.remove()
  }

  return { html, host, router, serverNodes }
}

let unmount: (() => void) | undefined
let error: ReturnType<typeof vi.spyOn>

describe('Vapor SSR hydration', () => {
  mockWarn()

  beforeEach(() => {
    // hydration mismatches are reported with console.error
    error = vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    unmount?.()
    unmount = undefined
    expect(error).not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('hydrates nested views and links rendered by the server', async () => {
    const { html, host, router, serverNodes } = await createApps(
      '<RouterView /><RouterLink to="/p/b">to b</RouterLink>'
    )
    expect(html).toBe(
      '<!--[--><!--[--><h1>P</h1><p>A</p><!--]--><a href="/p/b" class="">to b</a><!--]-->'
    )
    // the server nodes are reused
    expect(Array.from(host.querySelectorAll('*'))).toEqual(serverNodes)

    host.querySelector('a')!.click()
    await vi.waitFor(() => expect(host.textContent).toBe('PBto b'))
    expect(router.currentRoute.value.fullPath).toBe('/p/b')
    expect(host.querySelector('a')!.className).toBe(
      'router-link-active router-link-exact-active'
    )
  })

  it('hydrates the v-slot of RouterView', async () => {
    const { host, router, serverNodes } = await createApps(
      '<RouterView v-slot="{ Component }"><component :is="Component" /></RouterView>'
    )
    expect(Array.from(host.querySelectorAll('*'))).toEqual(serverNodes)

    await router.push('/p/b')
    await nextTick()
    expect(host.textContent).toBe('PB')
  })
})
