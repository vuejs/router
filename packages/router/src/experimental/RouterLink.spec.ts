/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { experimental_createRouter, normalizeRouteRecord } from './router'
import { createFixedResolver } from './route-resolver/resolver-fixed'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './route-resolver/matchers/matcher-pattern'
import { MatcherPatternQueryParam } from './route-resolver/matchers/matcher-pattern-query'
import { PARAM_PARSER_INT } from './route-resolver/matchers/param-parsers'
import { createMemoryHistory } from '../history/memory'
import { RouterView } from '../RouterView'
import { RouterLink, useLink, type UseLinkOptions } from './RouterLink'
import { mockWarn } from '../tests/vitest-mock-warn'

enableAutoUnmount(afterEach)
mockWarn()

const Page = defineComponent({ render: () => h('p', 'page') })
const Layout = defineComponent({ render: () => h(RouterView) })

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
  }: { initial?: string; router?: ReturnType<typeof createTestRouter> } = {}
) {
  await router.push(initial)
  const wrapper = mount(
    defineComponent({ components: { RouterLink, RouterView }, template }),
    { global: { plugins: [router] } }
  )
  await flushPromises()
  const go = async (to: string) => {
    await router.push(to)
    await flushPromises()
  }
  return { router, wrapper, go }
}

describe('experimental RouterLink', () => {
  it('renders the href of absolute and named locations', async () => {
    const { wrapper } = await factory(`
      <RouterLink id="a" to="/about">a</RouterLink>
      <RouterLink id="b" :to="{ name: 'user', params: { id: 2 } }">b</RouterLink>
      <RouterLink id="c" :to="{ path: '/search', query: { page: ['3'] } }">c</RouterLink>
    `)
    expect(wrapper.find('#a').attributes('href')).toBe('/about')
    expect(wrapper.find('#b').attributes('href')).toBe('/users/2')
    expect(wrapper.find('#c').attributes('href')).toBe('/search?page=3')
  })

  it('sets exact active classes and aria-current on the current route', async () => {
    const { wrapper, go } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    const a = () => wrapper.find('a')
    expect(a().classes()).toEqual([])
    expect(a().attributes('aria-current')).toBeUndefined()

    await go('/about')
    expect(a().classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
    ])
    expect(a().attributes('aria-current')).toBe('page')

    await go('/')
    expect(a().classes()).toEqual([])
  })

  it('is active but not exact active on a child route', async () => {
    const { wrapper } = await factory(
      `<RouterLink :to="{ name: 'users' }">users</RouterLink>`,
      { initial: '/users/2' }
    )
    expect(wrapper.find('a').classes()).toEqual(['router-link-active'])
  })

  it('compares params', async () => {
    const { wrapper, go } = await factory(
      `<RouterLink to="/users/1">1</RouterLink>`,
      { initial: '/users/2' }
    )
    expect(wrapper.find('a').classes()).toEqual([])
    await go('/users/1')
    expect(wrapper.find('a').classes()).toContain('router-link-exact-active')
  })

  describe('index child', () => {
    it('is active through the parent on a sibling route', async () => {
      const { wrapper, go } = await factory(
        `<RouterLink to="/users">users</RouterLink>`,
        { initial: '/users/2' }
      )
      expect(wrapper.find('a').classes()).toEqual(['router-link-active'])
      await go('/users')
      expect(wrapper.find('a').classes()).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
    })

    it('is not active when the parent itself is displayed', async () => {
      const { wrapper, router } = await factory(
        `<RouterLink to="/users">users</RouterLink>`
      )
      await router.push({ name: 'users' })
      await flushPromises()
      expect(router.currentRoute.value.matched).toHaveLength(1)
      expect(wrapper.find('a').classes()).toEqual([])
    })
  })

  it('is exact active on an alias of the target', async () => {
    const { wrapper } = await factory(
      `<RouterLink to="/about">a</RouterLink>`,
      {
        initial: '/about-alias',
      }
    )
    expect(wrapper.find('a').classes()).toContain('router-link-exact-active')
  })

  it('compares declared query params but ignores other query values', async () => {
    const { wrapper } = await factory(
      `
      <RouterLink id="p2" to="/search?page=2">2</RouterLink>
      <RouterLink id="p3" to="/search?page=3">3</RouterLink>
      <RouterLink id="other" to="/search?page=3&q=vue">3</RouterLink>
    `,
      { initial: '/search?page=3' }
    )
    expect(wrapper.find('#p2').classes()).toEqual([])
    expect(wrapper.find('#p3').classes()).toContain('router-link-exact-active')
    expect(wrapper.find('#other').classes()).toContain(
      'router-link-exact-active'
    )
  })

  it('uses the class props, then the router options', async () => {
    const { wrapper } = await factory(
      `
      <RouterLink id="a" to="/about">a</RouterLink>
      <RouterLink id="b" to="/about" active-class="on" exact-active-class="exact">b</RouterLink>
    `,
      {
        initial: '/about',
        router: createTestRouter({ linkActiveClass: 'global-on' }),
      }
    )
    expect(wrapper.find('#a').classes()).toEqual([
      'global-on',
      'router-link-exact-active',
    ])
    expect(wrapper.find('#b').classes()).toEqual(['on', 'exact'])
  })

  it('navigates on click', async () => {
    const { wrapper, router } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    await wrapper.find('a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/about')
  })

  it('does not navigate on a click with a modifier key', async () => {
    const { wrapper, router } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    await wrapper.find('a').trigger('click', { ctrlKey: true })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('replaces the current entry with replace', async () => {
    const { wrapper, router, go } = await factory(
      `<RouterLink to="/about" replace>a</RouterLink>`
    )
    await go('/users/1')
    await wrapper.find('a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/about')
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('renders only the slot with custom', async () => {
    const { wrapper } = await factory(
      `
      <RouterLink to="/about" custom v-slot="{ href, isActive, isExactActive, route }">
        <span>{{ href }} {{ isActive }} {{ isExactActive }} {{ route.name }}</span>
      </RouterLink>
    `,
      { initial: '/about' }
    )
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.html()).toBe('<span>/about true true about</span>')
  })

  it('compares against the route of the closest RouterView', async () => {
    const router = createTestRouter()
    await router.push('/users/1')
    const shown = router.resolve('/users/2')
    const Child = defineComponent({
      components: { RouterLink },
      template: `<RouterLink to="/users/2">2</RouterLink>`,
    })
    const wrapper = mount(
      defineComponent({
        components: { RouterView, Child },
        setup: () => ({ shown }),
        template: `<RouterView :route="shown"><Child /></RouterView>`,
      }),
      { global: { plugins: [router] } }
    )
    await flushPromises()
    expect(wrapper.find('a').classes()).toContain('router-link-exact-active')
  })

  it('warns on an invalid to', async () => {
    const router = createTestRouter()
    await router.push('/')
    // throws after the warning, as in production
    expect(() =>
      mount(
        defineComponent({
          components: { RouterLink },
          template: `<RouterLink :to="null">a</RouterLink>`,
        }),
        { global: { plugins: [router] } }
      )
    ).toThrow()
    expect('VUE_ROUTER_R0050').toHaveBeenWarned()
    expect('Invalid prop').toHaveBeenWarned()
  })

  it.todo('resolves relative locations against the current route')
})

describe('experimental useLink', () => {
  async function withLink(options: UseLinkOptions, initial = '/') {
    let link!: ReturnType<typeof useLink>
    const router = createTestRouter()
    await router.push(initial)
    mount(
      defineComponent({
        setup() {
          link = useLink(options)
          return () => null
        },
      }),
      { global: { plugins: [router] } }
    )
    return { link, router }
  }

  it('follows a ref and a getter', async () => {
    const id = ref(1)
    const { link } = await withLink({
      to: () => ({ name: 'user', params: { id: id.value } }),
    })
    expect(link.href.value).toBe('/users/1')
    id.value = 2
    expect(link.href.value).toBe('/users/2')

    const to = ref('/about')
    const { link: other } = await withLink({ to }, '/about')
    expect(other.isExactActive.value).toBe(true)
    to.value = '/'
    expect(other.isActive.value).toBe(false)
  })

  it('navigates with navigate()', async () => {
    const { link, router } = await withLink({ to: '/about' })
    await link.navigate()
    expect(router.currentRoute.value.path).toBe('/about')
  })
})
