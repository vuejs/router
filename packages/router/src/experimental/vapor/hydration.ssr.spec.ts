/**
 * @vitest-environment happy-dom
 */
import { renderToString } from '@vue/server-renderer'
import { createSSRApp, createVaporSSRApp, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory } from '../../history/memory'
import { createRouter } from '../../router'
import type { RouteRecordRaw } from '../../types'
import { onRouteRendered } from '../on-route-rendered'
import { RouterLink } from './RouterLink'
import { RouterView } from './RouterView'
import { compileVaporSFC } from '../../tests/vapor'

// There is no Vapor runtime on the server: it renders the `ssrRender` of
// Vapor SFCs, and the VDOM RouterView and RouterLink that `createRouter()`
// registers in a VDOM app.

let host: HTMLElement
let app: ReturnType<typeof createVaporSSRApp> | undefined
let warn: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
  warn.mockRestore()
})

type Page = (template: string, setup?: () => void) => any

/**
 * Renders `root` at `url` on the server, then hydrates the HTML with a Vapor
 * app. `routes` builds the route records of each side from the same templates.
 */
async function hydrate(
  url: string,
  root: string,
  routes: (page: Page) => RouteRecordRaw[]
) {
  const create = async (ssr: boolean) => {
    const page: Page = (template, setup) => {
      const component = compileVaporSFC(
        // an empty script block is dropped by the SFC parser
        `<script setup vapor>/**/</script><template>${template}</template>`,
        ssr
      )
      if (setup) {
        const render = component.setup
        component.setup = (...args: unknown[]) => (setup(), render(...args))
      }
      return component
    }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: routes(page),
    })
    await router.push(url)
    await router.isReady()
    return { router, Root: page(root) }
  }

  const server = await create(true)
  host.innerHTML = await renderToString(
    createSSRApp(server.Root).use(server.router)
  )
  const elements = [...host.querySelectorAll('*')]

  const client = await create(false)
  app = createVaporSSRApp(client.Root)
  app.use(client.router)
  app.component('RouterView', RouterView)
  app.component('RouterLink', RouterLink)
  app.mount(host)
  await nextTick()

  // the server elements are adopted, none is created again
  expect(warn).not.toHaveBeenCalled()
  expect([...host.querySelectorAll('*')]).toEqual(elements)

  const go = async (to: string) => {
    await client.router.push(to)
    await nextTick()
    await nextTick()
  }
  return { router: client.router, go }
}

const text = () => host.textContent

describe('Vapor SSR hydration', () => {
  const pages: [name: string, template: string, text: string][] = [
    ['one root', `<p>page</p>`, 'page'],
    ['several roots', `<h1>title</h1><p>page</p>`, 'titlepage'],
    ['a list as its root', `<li v-for="i in 2">{{ i }}</li>`, '12'],
  ]

  describe.each([
    ['RouterView', `<main><RouterView /></main>`],
    [
      'RouterView v-slot',
      `<main>
        <RouterView v-slot="{ Component }">
          <component :is="Component" />
        </RouterView>
      </main>`,
    ],
    [
      'RouterView v-slot, with v-if',
      `<main>
        <RouterView v-slot="{ Component }">
          <component v-if="Component" :is="Component" />
        </RouterView>
      </main>`,
    ],
    [
      'RouterView v-slot, in KeepAlive',
      `<main>
        <RouterView v-slot="{ Component }">
          <KeepAlive><component :is="Component" /></KeepAlive>
        </RouterView>
      </main>`,
    ],
  ])('%s', (_, root) => {
    it.each(pages)('hydrates a page with %s', async (_, template, content) => {
      const { go } = await hydrate('/', root, page => [
        { path: '/', component: page(template) },
        { path: '/other', component: page(`<p>other</p>`) },
      ])
      expect(text()).toBe(content)

      await go('/other')
      expect(text()).toBe('other')
      await go('/')
      expect(text()).toBe(content)
    })
  })

  it('hydrates nested views and links rendered by the server', async () => {
    const { router } = await hydrate('/p/a', `<RouterView />`, page => [
      {
        path: '/p',
        component: page(
          `<nav>
            <RouterLink to="/p/a">a</RouterLink>
            <RouterLink to="/p/b">b</RouterLink>
          </nav>
          <RouterView />`
        ),
        children: [
          { path: 'a', component: page(`<h2>A</h2><p>first</p>`) },
          { path: 'b', component: page(`<p>second</p>`) },
        ],
      },
    ])
    expect(host.querySelector('nav + h2')!.textContent).toBe('A')
    const nav = host.querySelector('nav')
    const [a, b] = host.querySelectorAll('a')
    expect(a.className).toBe('router-link-active router-link-exact-active')
    expect(b.className).toBe('')

    // the links are interactive
    b.click()
    await vi.waitFor(() =>
      expect(router.currentRoute.value.fullPath).toBe('/p/b')
    )
    await nextTick()
    expect(host.querySelector('nav + p')!.textContent).toBe('second')
    // the parent view is kept
    expect(host.querySelector('nav')).toBe(nav)
    expect(a.className).toBe('')
    expect(b.className).toBe('router-link-active router-link-exact-active')
  })

  it('calls onRouteRendered once the hydrated view is displayed', async () => {
    const rendered: string[] = []
    const track = () => {
      onRouteRendered(to => {
        rendered.push(`${to.fullPath} "${text()}"`)
      })
    }
    const { go } = await hydrate('/', `<RouterView />`, page => [
      { path: '/', component: page(`<p>home</p>`, track) },
      { path: '/other', component: page(`<p>other</p>`, track) },
    ])
    await nextTick()
    expect(rendered).toEqual(['/ "home"'])

    await go('/other')
    expect(rendered).toEqual(['/ "home"', '/other "other"'])
  })
})
