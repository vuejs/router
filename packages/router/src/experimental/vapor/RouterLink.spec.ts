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
import { experimental_createRouter, normalizeRouteRecord } from '../router'
import { createFixedResolver } from '../route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from '../route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from '../route-resolver/matchers/matcher-pattern-query'
import { PARAM_PARSER_INT } from '../route-resolver/matchers/param-parsers'
import { createMemoryHistory } from '../../history/memory'
import { RouterLink } from './RouterLink'
import { RouterView } from './RouterView'
import { useLink } from '../RouterLink'
import { compileVapor } from '../../tests/vapor'
import { mockWarn } from '../../tests/vitest-mock-warn'

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

function createTestRouter(options: { linkActiveClass?: string } = {}) {
  const home = normalizeRouteRecord({
    name: 'home',
    path: new MatcherPatternPathStatic('/'),
    components: { default: Page },
  })
  const users = normalizeRouteRecord({
    name: 'users',
    path: new MatcherPatternPathStatic('/users'),
    components: { default: Layout },
  })
  // index child: shares the path matcher of its parent
  const usersIndex = normalizeRouteRecord({
    name: 'users-index',
    path: users.path,
    components: { default: Page },
    parent: users,
  })
  const user = normalizeRouteRecord({
    name: 'user',
    path: new MatcherPatternPathDynamic(
      /^\/users\/([^/]+?)$/i,
      { id: [PARAM_PARSER_INT] },
      ['users', 1]
    ),
    components: { default: Page },
    parent: users,
  })
  const about = normalizeRouteRecord({
    name: 'about',
    path: new MatcherPatternPathStatic('/about'),
    components: { default: Page },
  })
  const aboutAlias = normalizeRouteRecord({
    ...about,
    path: new MatcherPatternPathStatic('/about-alias'),
    aliasOf: about,
  })
  const search = normalizeRouteRecord({
    name: 'search',
    path: new MatcherPatternPathStatic('/search'),
    query: [
      new MatcherPatternQueryParam(
        'page',
        'page',
        'value',
        PARAM_PARSER_INT,
        1
      ),
    ],
    components: { default: Page },
  })

  return experimental_createRouter({
    history: createMemoryHistory(),
    resolver: createFixedResolver([
      home,
      usersIndex,
      users,
      user,
      about,
      aboutAlias,
      search,
    ]),
    ...options,
  })
}

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
  it('renders the href of absolute and named locations', async () => {
    const { find } = await factory(`
      <RouterLink id="a" to="/about">a</RouterLink>
      <RouterLink id="b" :to="{ name: 'user', params: { id: 2 } }">b</RouterLink>
      <RouterLink id="c" :to="{ path: '/search', query: { page: ['3'] } }">c</RouterLink>
    `)
    expect(find('#a').getAttribute('href')).toBe('/about')
    expect(find('#b').getAttribute('href')).toBe('/users/2')
    expect(find('#c').getAttribute('href')).toBe('/search?page=3')
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

  it('compares params', async () => {
    const { classes, go } = await factory(
      `<RouterLink to="/users/1">1</RouterLink>`,
      { initial: '/users/2' }
    )
    expect(classes()).toEqual([])
    await go('/users/1')
    expect(classes()).toContain('router-link-exact-active')
  })

  describe('index child', () => {
    it('is active through the parent on a sibling route', async () => {
      const { classes, go } = await factory(
        `<RouterLink to="/users">users</RouterLink>`,
        { initial: '/users/2' }
      )
      expect(classes()).toEqual(['router-link-active'])
      await go('/users')
      expect(classes()).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
    })

    it('is not active when the parent itself is displayed', async () => {
      const { classes, router } = await factory(
        `<RouterLink to="/users">users</RouterLink>`
      )
      await router.push({ name: 'users' })
      await nextTick()
      expect(router.currentRoute.value.matched).toHaveLength(1)
      expect(classes()).toEqual([])
    })
  })

  it('is exact active on an alias of the target', async () => {
    const { classes } = await factory(
      `<RouterLink to="/about">a</RouterLink>`,
      {
        initial: '/about-alias',
      }
    )
    expect(classes()).toContain('router-link-exact-active')
  })

  it('compares declared query params but ignores other query values', async () => {
    const { classes } = await factory(
      `
      <RouterLink id="p2" to="/search?page=2">2</RouterLink>
      <RouterLink id="p3" to="/search?page=3">3</RouterLink>
      <RouterLink id="other" to="/search?page=3&q=vue">3</RouterLink>
    `,
      { initial: '/search?page=3' }
    )
    expect(classes('#p2')).toEqual([])
    expect(classes('#p3')).toContain('router-link-exact-active')
    expect(classes('#other')).toContain('router-link-exact-active')
  })

  it('uses the class props, then the router options', async () => {
    const { classes } = await factory(
      `
      <RouterLink id="a" to="/about">a</RouterLink>
      <RouterLink id="b" to="/about" active-class="on" exact-active-class="exact">b</RouterLink>
    `,
      {
        initial: '/about',
        router: createTestRouter({ linkActiveClass: 'global-on' }),
      }
    )
    expect(classes('#a')).toEqual(['global-on', 'router-link-exact-active'])
    expect(classes('#b')).toEqual(['on', 'exact'])
  })

  it('merges the attrs with the rendered a', async () => {
    const onClick = vi.fn()
    const { find, classes, router } = await factory(
      `<RouterLink to="/about" class="x" title="t" @click="onClick">a</RouterLink>`,
      { initial: '/about', setup: () => ({ onClick }) }
    )
    expect(find('a').getAttribute('title')).toBe('t')
    expect(classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
      'x',
    ])
    await router.push('/')
    await nextTick()
    expect(classes()).toEqual(['x'])
    find('a').click()
    expect(onClick).toHaveBeenCalledTimes(1)
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/about')
    )
  })

  it('navigates on click', async () => {
    const { find, router } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    find('a').click()
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/about')
    )
  })

  it('does not navigate on a click with a modifier key', async () => {
    const { find, router } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    find('a').dispatchEvent(
      new MouseEvent('click', { ctrlKey: true, bubbles: true })
    )
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('replaces the current entry with replace', async () => {
    const { find, router, go } = await factory(
      `<RouterLink to="/about" replace>a</RouterLink>`
    )
    await go('/users/1')
    find('a').click()
    await vi.waitFor(() =>
      expect(router.currentRoute.value.path).toBe('/about')
    )
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/'))
  })

  it('renders only the slot with custom', async () => {
    const { find } = await factory(
      `
      <RouterLink to="/about" custom v-slot="{ href, isActive, isExactActive, route }">
        <span>{{ href }} {{ isActive }} {{ isExactActive }} {{ route.name }}</span>
      </RouterLink>
    `,
      { initial: '/about' }
    )
    expect(find('a')).toBeNull()
    expect(find('span').outerHTML).toBe('<span>/about true true about</span>')
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
    await router.push('/users/1')
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
    const router = createTestRouter()
    await router.push('/')
    // throws after the warning, as in production
    await expect(
      factory(`<RouterLink :to="null">a</RouterLink>`, { router })
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
