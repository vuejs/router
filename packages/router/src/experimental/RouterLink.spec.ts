/**
 * @vitest-environment happy-dom
 */
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, type Component } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from '../RouterView'
import { RouterLink } from './RouterLink'
import { mockWarn } from '../tests/vitest-mock-warn'
import {
  createLinkTestRouter,
  type LinkTestRouterOptions,
} from '../tests/link-router'

enableAutoUnmount(afterEach)
mockWarn()

const Page = defineComponent({ render: () => h('p', 'page') })
const Layout = defineComponent({ render: () => h(RouterView) })

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

  it('uses a custom aria-current-value', async () => {
    const { wrapper } = await factory(
      `<RouterLink to="/about" aria-current-value="time">a</RouterLink>`,
      { initial: '/about' }
    )
    expect(wrapper.find('a').attributes('aria-current')).toBe('time')
  })

  it('is not active when the target matches no route', async () => {
    const { classes } = await factory(
      `<RouterLink to="/nowhere">a</RouterLink>`,
      { initial: '/nowhere' }
    )
    expect(classes()).toEqual([])
    expect('No match found').toHaveBeenWarned()
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

  describe('repeated params', () => {
    it.each([
      ['/files/1/2', '/files/1'],
      ['/files/1/2', '/files/1/3'],
      ['/files/1/2', '/files/1/2/3'],
      ['/files/1/2/3', '/files/1/2'],
    ])('is not active on %s with a link to %s', async (initial, to) => {
      const { classes } = await factory(`<RouterLink :to="to">a</RouterLink>`, {
        initial,
        setup: () => ({ to }),
      })
      expect(classes()).toEqual([])
    })
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

    it('is active through the parent on a grandchild route', async () => {
      const { classes } = await factory(
        `<RouterLink to="/users">users</RouterLink>`,
        { initial: '/users/2/posts' }
      )
      expect(classes()).toEqual(['router-link-active'])
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

  describe('aliases', () => {
    it('is exact active on the original of the target', async () => {
      const { classes } = await factory(
        `<RouterLink to="/about-alias">a</RouterLink>`,
        { initial: '/about' }
      )
      expect(classes()).toContain('router-link-exact-active')
    })

    it('an alias of an index child is active through the parent on a sibling', async () => {
      const { classes, go } = await factory(
        `<RouterLink to="/users/list">list</RouterLink>`,
        { initial: '/users/2' }
      )
      expect(classes()).toEqual(['router-link-active'])
      await go('/users/2/posts')
      expect(classes()).toEqual(['router-link-active'])
    })

    it('an alias of the parent is active on a child', async () => {
      const { classes, go } = await factory(
        `<RouterLink to="/u">u</RouterLink>`,
        {
          initial: '/users/2',
        }
      )
      expect(classes()).toEqual(['router-link-active'])
      // parent and child are both aliases
      await go('/u/id/2')
      expect(classes()).toEqual(['router-link-active'])
    })

    it('an alias of the parent is exact active on the parent and reverse', async () => {
      const { classes, router } = await factory(
        `
        <RouterLink id="alias" to="/u">u</RouterLink>
        <RouterLink id="orig" :to="{ name: 'users' }">users</RouterLink>
      `
      )
      await router.push({ name: 'users' })
      await flushPromises()
      expect(classes('#alias')).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
      await router.push('/u')
      await flushPromises()
      expect(classes('#orig')).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
    })

    it('is exact active on a child with aliased parent and child', async () => {
      const { classes } = await factory(
        `
        <RouterLink id="both" to="/u/id/2">a</RouterLink>
        <RouterLink id="parent" to="/u/2">b</RouterLink>
      `,
        { initial: '/users/2' }
      )
      expect(classes('#both')).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
      expect(classes('#parent')).toEqual([
        'router-link-active',
        'router-link-exact-active',
      ])
    })

    it('keeps the alias URL on click', async () => {
      const { wrapper, router } = await factory(
        `<RouterLink to="/about-alias">a</RouterLink>`
      )
      await wrapper.find('a').trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.fullPath).toBe('/about-alias')
    })
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
        router: createTestRouter({
          linkActiveClass: 'global-on',
          linkExactActiveClass: 'global-exact',
        }),
      }
    )
    expect(classes('#a')).toEqual(['global-on', 'global-exact'])
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

  it('merges the attrs with the rendered a', async () => {
    const { wrapper, classes, go } = await factory(
      `<RouterLink to="/about" class="x" title="t">a</RouterLink>`,
      { initial: '/about' }
    )
    expect(wrapper.find('a').attributes('title')).toBe('t')
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
    const { wrapper, router } = await factory(
      `<RouterLink to="/about" @click="onClick">a</RouterLink>`,
      { setup: () => ({ onClick }) }
    )
    await wrapper.find('a').trigger('click')
    await flushPromises()
    expect(onClick).toHaveBeenCalledTimes(1)
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
    expect('VUE_ROUTER_D0003').toHaveBeenWarned()
  })

  it('passes a reactive scope to the slot', async () => {
    const { wrapper, go } = await factory(
      `<RouterLink to="/about" v-slot="{ isExactActive }">{{ isExactActive }}</RouterLink>`
    )
    expect(wrapper.find('a').text()).toBe('false')
    await go('/about')
    expect(wrapper.find('a').text()).toBe('true')
  })

  // #2375
  it('applies a directive on a custom link to the slot root', async () => {
    const AppLink = defineComponent({
      components: { RouterLink },
      directives: { Test: (el: Element) => el.setAttribute('data-test', 'x') },
      template: `<RouterLink to="/about" custom v-test><a /></RouterLink>`,
    })
    const { wrapper } = await factory(`<AppLink />`, {
      components: { AppLink },
    })
    expect(wrapper.find('a').attributes('data-test')).toBe('x')
    expect('VUE_ROUTER_D0003').toHaveBeenWarned()
  })

  describe('wrapped in a component', () => {
    const AppLink = defineComponent({
      components: { RouterLink },
      inheritAttrs: false,
      props: {
        ...(RouterLink as any).props,
        inactiveClass: String,
      },
      template: `
        <a v-if="typeof to === 'string' && to.startsWith('http')" v-bind="$attrs" :href="to"><slot /></a>
        <RouterLink v-else v-bind="$props" custom v-slot="{ isActive, href, navigate }">
          <a v-bind="$attrs" :href="href" @click="navigate" :class="isActive ? activeClass : inactiveClass">
            <slot />
          </a>
        </RouterLink>
      `,
    })

    it('uses its own inactive class', async () => {
      const { classes, go } = await factory(
        `<AppLink to="/about" active-class="active" inactive-class="inactive" />`,
        { components: { AppLink } }
      )
      expect(classes()).toEqual(['inactive'])
      await go('/about')
      expect(classes()).toEqual(['active'])
      expect('VUE_ROUTER_D0003').toHaveBeenWarned()
    })

    it('renders an external link', async () => {
      const { wrapper, classes } = await factory(
        `<AppLink to="https://esm.dev" />`,
        { components: { AppLink } }
      )
      expect(classes()).toEqual([])
      expect(wrapper.find('a').attributes('href')).toBe('https://esm.dev')
    })
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
