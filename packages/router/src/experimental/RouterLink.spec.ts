/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, type Component } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { RouterView } from '../RouterView'
import { RouterLink } from './RouterLink'
import { mockWarn } from '../tests/vitest-mock-warn'
import { createLinkTestRouter } from '../tests/link-router'

enableAutoUnmount(afterEach)
mockWarn()

const Page = defineComponent({ render: () => h('p', 'page') })
const Layout = defineComponent({ render: () => h(RouterView) })

const createTestRouter = (options?: { linkActiveClass?: string }) =>
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
    components?: Record<string, Component>
  } = {}
) {
  await router.push(initial)
  const wrapper = mount(
    defineComponent({
      components: { RouterLink, RouterView, ...components },
      setup,
      template,
    }),
    { global: { plugins: [router] } }
  )
  await flushPromises()
  const go = async (to: string) => {
    await router.push(to)
    await flushPromises()
  }
  const classes = (selector = 'a') => wrapper.find(selector).classes()
  return { router, wrapper, go, classes }
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
    const { wrapper, classes, go } = await factory(
      `<RouterLink to="/about">a</RouterLink>`
    )
    expect(classes()).toEqual([])
    expect(wrapper.find('a').attributes('aria-current')).toBeUndefined()

    await go('/about')
    expect(classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
    ])
    expect(wrapper.find('a').attributes('aria-current')).toBe('page')

    await go('/')
    expect(classes()).toEqual([])
    expect(wrapper.find('a').attributes('aria-current')).toBeUndefined()
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
      await flushPromises()
      expect(router.currentRoute.value.matched).toHaveLength(1)
      expect(classes()).toEqual([])
    })
  })

  it('is exact active on an alias of the target', async () => {
    const { classes } = await factory(
      `<RouterLink to="/about">a</RouterLink>`,
      { initial: '/about-alias' }
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
    const shown = router.resolve('/users/2')
    const Child = defineComponent({
      components: { RouterLink },
      template: `<RouterLink to="/users/2">2</RouterLink>`,
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
    expect('VUE_ROUTER_R0050').toHaveBeenWarned()
    expect('Invalid prop').toHaveBeenWarned()
  })

  it.todo('resolves relative locations against the current route')
})
