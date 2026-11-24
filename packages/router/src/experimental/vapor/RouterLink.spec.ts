/**
 * @vitest-environment happy-dom
 */
import {
  createVaporApp,
  defineVaporComponent,
  nextTick,
  type VaporComponent,
} from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterLink } from './RouterLink'
import { RouterView } from './RouterView'
import { useLink } from '../RouterLink'
import { compileVapor } from '../../tests/vapor'
import { mockWarn } from '../../tests/vitest-mock-warn'
import {
  createLinkTestRouter,
  type LinkTestRouterOptions,
} from '../../tests/link-router'

// active states and navigation come from useLink(): see ../RouterLink.spec.ts

mockWarn()

let host: HTMLElement
let app: ReturnType<typeof createVaporApp> | undefined
beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})
afterEach(() => {
  app?.unmount()
  app = undefined
  host.remove()
})

const Page = defineVaporComponent({ render: compileVapor('<p>page</p>') })
const Layout = defineVaporComponent({
  render: compileVapor('<RouterView />'),
})

const createTestRouter = (options?: LinkTestRouterOptions) =>
  createLinkTestRouter({ Page, Layout }, options)

async function factory(
  template: string,
  {
    initial = '/',
    router = createTestRouter(),
    setup,
    components = {},
  }: {
    initial?: string
    router?: ReturnType<typeof createTestRouter>
    setup?: () => Record<string, unknown>
    components?: Record<string, VaporComponent>
  } = {}
) {
  await router.push(initial)
  app = createVaporApp(
    defineVaporComponent({ setup, render: compileVapor(template) })
  )
  app
    .use(router)
    .component('RouterLink', RouterLink)
    .component('RouterView', RouterView)
  for (const name in components) app.component(name, components[name] as any)
  app.mount(host)
  await nextTick()
  const go = async (to: string) => {
    await router.push(to)
    await nextTick()
  }
  const find = (selector: string) => host.querySelector<HTMLElement>(selector)!
  const classes = (selector = 'a') => [...find(selector).classList]
  return { router, go, find, classes }
}

describe('Vapor RouterLink', () => {
  it('renders the href', async () => {
    const { find } = await factory(
      `<RouterLink :to="{ name: 'user', params: { id: 2 } }">a</RouterLink>`
    )
    expect(find('a').getAttribute('href')).toBe('/users/2')
  })

  it('sets exact active classes and aria-current on the current route', async () => {
    const { find, classes, go } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    expect(classes()).toEqual([])
    expect(find('a').getAttribute('aria-current')).toBeNull()

    await go('/about')
    expect(classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
    ])
    expect(find('a').getAttribute('aria-current')).toBe('page')

    await go('/')
    expect(classes()).toEqual([])
    expect(find('a').getAttribute('aria-current')).toBeNull()
  })

  it('is active but not exact active on a child route', async () => {
    const { classes } = await factory(
      `<RouterLink :to="{ name: 'users' }">users</RouterLink>`,
      { initial: '/users/2' }
    )
    expect(classes()).toEqual(['router-link-active'])
  })

  it('uses the class props, then the router options', async () => {
    const { classes } = await factory(
      `
      <RouterLink id="a" to="/about">a</RouterLink>
      <RouterLink id="b" to="/about" active-class="on" exact-active-class="exact">b</RouterLink>
    `,
      {
        initial: '/about',
        router: createTestRouter({
          linkActiveClass: 'global-on',
          linkExactActiveClass: 'global-exact',
        }),
      }
    )
    expect(classes('#a')).toEqual(['global-on', 'global-exact'])
    expect(classes('#b')).toEqual(['on', 'exact'])
  })

  it('merges the attrs with the rendered a', async () => {
    const { find, classes, go } = await factory(
      `<RouterLink to="/about" class="x" title="t">a</RouterLink>`,
      { initial: '/about' }
    )
    expect(find('a').getAttribute('title')).toBe('t')
    expect(classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
      'x',
    ])
    await go('/')
    expect(classes()).toEqual(['x'])
  })

  it('navigates on click and calls the onClick listener', async () => {
    const onClick = vi.fn()
    const { find, router } = await factory(
      `<RouterLink to="/about" @click="onClick">a</RouterLink>`,
      { setup: () => ({ onClick }) }
    )
    find('a').click()
    expect(onClick).toHaveBeenCalledTimes(1)
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/about')
    )
  })

  it('warns on custom', async () => {
    await factory(`<RouterLink to="/about" custom>a</RouterLink>`)
    expect('VUE_ROUTER_R0051').toHaveBeenWarned()
  })

  it('passes a reactive scope to the slot', async () => {
    const { find, go } = await factory(
      `<RouterLink to="/about" v-slot="{ isExactActive }">{{ isExactActive }}</RouterLink>`
    )
    expect(find('a').textContent).toBe('false')
    await go('/about')
    expect(find('a').textContent).toBe('true')
  })

  it('compares against the route of the closest RouterView', async () => {
    const router = createTestRouter()
    const shown = router.resolve('/users/2')
    const Child = defineVaporComponent({
      render: compileVapor(`<RouterLink to="/users/2">2</RouterLink>`),
    })
    const { classes } = await factory(
      `<RouterView :route="shown"><Child /></RouterView>`,
      {
        router,
        initial: '/users/1',
        setup: () => ({ shown }),
        components: { Child },
      }
    )
    expect(classes()).toContain('router-link-exact-active')
  })

  it('warns on an invalid to', async () => {
    // throws after the warning, as in production
    await expect(
      factory(`<RouterLink :to="null">a</RouterLink>`)
    ).rejects.toThrow()
    // never mounted
    app = undefined
    expect('VUE_ROUTER_R0050').toHaveBeenWarned()
    expect('Invalid prop').toHaveBeenWarned()
    expect('Unhandled error during execution of setup').toHaveBeenWarned()
  })

  it('exposes useLink', () => {
    expect(RouterLink.useLink).toBe(useLink)
  })
})
