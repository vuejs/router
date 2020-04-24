/**
 * @jest-environment jsdom
 */
import { RouterLink } from '../src/RouterLink'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocationRaw,
  RouteLocationNormalized,
} from '../src/types'
import { createMemoryHistory } from '../src'
import { mount, createMockedRoute } from './mount'
import { nextTick } from 'vue'
import { RouteRecordNormalized } from '../src/matcher/types'
import { routerKey } from '../src/injectionSymbols'

const records = {
  home: {} as RouteRecordNormalized,
  homeAlias: {} as RouteRecordNormalized,
  foo: {} as RouteRecordNormalized,
  parent: {} as RouteRecordNormalized,
  child: {} as RouteRecordNormalized,
  parentAlias: {} as RouteRecordNormalized,
  childAlias: {} as RouteRecordNormalized,
}

// fix the aliasOf
records.homeAlias = { aliasOf: records.home } as RouteRecordNormalized
records.parentAlias = {
  aliasOf: records.parent,
} as RouteRecordNormalized
records.childAlias = { aliasOf: records.child } as RouteRecordNormalized

type RouteLocationResolved = RouteLocationNormalized & { href: string }

const locations: Record<
  string,
  {
    string: string
    normalized: RouteLocationResolved
    toResolve?: MatcherLocationRaw & Required<RouteQueryAndHash>
  }
> = {
  basic: {
    string: '/home',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      href: '/home',
      fullPath: '/home',
      path: '/home',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: 'home',
    },
  },
  foo: {
    string: '/foo',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/foo',
      href: '/foo',
      path: '/foo',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.foo],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  withQuery: {
    string: '/home?foo=a&bar=b',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home?foo=a&bar=b',
      href: '/home?foo=a&bar=b',
      path: '/home',
      params: {},
      meta: {},
      query: { foo: 'a', bar: 'b' },
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  repeatedParams2: {
    string: '/p/1/2',
    normalized: {
      fullPath: '/p/1/2',
      href: '/p/1/2',
      path: '/p/1/2',
      params: { p: ['1', '2'] },
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  repeatedParams3: {
    string: '/p/1/2/3',
    normalized: {
      fullPath: '/p/1/2/3',
      href: '/p/1/2/3',
      path: '/p/1/2/3',
      params: { p: ['1', '2', '3'] },
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  alias: {
    string: '/alias',
    normalized: {
      fullPath: '/alias',
      href: '/alias',
      path: '/alias',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.homeAlias],
      redirectedFrom: undefined,
      name: 'home',
    },
  },

  // nested routes
  parent: {
    string: '/parent',
    normalized: {
      fullPath: '/parent',
      href: '/parent',
      path: '/parent',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  parentAlias: {
    string: '/p',
    normalized: {
      fullPath: '/p',
      href: '/p',
      path: '/p',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },

  child: {
    string: '/parent/child',
    normalized: {
      fullPath: '/parent/child',
      href: '/parent/child',
      path: '/parent/child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.child],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childAsAbsolute: {
    string: '/absolute-child',
    normalized: {
      fullPath: '/absolute-child',
      href: '/absolute-child',
      path: '/absolute-child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.child],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childParentAlias: {
    string: '/p/child',
    normalized: {
      fullPath: '/p/child',
      href: '/p/child',
      path: '/p/child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias, records.child],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childAlias: {
    string: '/parent/c',
    normalized: {
      fullPath: '/parent/c',
      href: '/parent/c',
      path: '/parent/c',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.childAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childDoubleAlias: {
    string: '/p/c',
    normalized: {
      fullPath: '/p/c',
      href: '/p/c',
      path: '/p/c',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parentAlias, records.childAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  notFound: {
    string: '/not-found',
    normalized: {
      fullPath: '/not-found',
      href: '/not-found',
      path: '/not-found',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
}

async function factory(
  currentLocation: RouteLocationNormalized,
  propsData: any,
  resolvedLocation: RouteLocationResolved,
  slotTemplate: string = ''
) {
  const route = createMockedRoute(currentLocation)
  const router = {
    history: createMemoryHistory(),
    createHref(to: RouteLocationNormalized): string {
      return this.history.base + to.fullPath
    },
    resolve: jest.fn(),
    push: jest.fn().mockResolvedValue(resolvedLocation),
  }
  router.resolve.mockReturnValueOnce(resolvedLocation)

  const wrapper = await mount(RouterLink, {
    propsData,
    provide: {
      [routerKey as any]: router,
      ...route.provides,
    },
    slots: { default: slotTemplate },
  })

  return { router, wrapper, route }
}

describe('RouterLink', () => {
  it('displays a link with a string prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.getAttribute('href')).toBe('/home')
  })

  it('displays a link with a string prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.getAttribute('href')).toBe('/home')
  })

  it('can change the value', async () => {
    const { wrapper, router } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.getAttribute('href')).toBe('/home')
    router.resolve.mockReturnValueOnce(locations.foo.normalized)
    await wrapper.setProps({ to: locations.foo.string })
    expect(wrapper.find('a')!.getAttribute('href')).toBe('/foo')
  })

  it('displays a link with an object with path prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.getAttribute('href')).toBe('/home')
  })

  it('can be active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
  })

  it('can customize active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, activeClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).not.toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('is-active')
  })

  it('can customize exact active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, exactActiveClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
    expect(wrapper.find('a')!.className).toContain('is-active')
  })

  it('can be active with custom class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, class: 'nav-item' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('nav-item')
  })

  it('is not active on a non matched location', async () => {
    const { wrapper } = await factory(
      locations.notFound.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).toBe('')
  })

  it('is not active with more repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams2.normalized,
      { to: locations.repeatedParams3.string },
      locations.repeatedParams3.normalized
    )
    expect(wrapper.find('a')!.className).toBe('')
  })

  it('is not active with partial repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams3.normalized,
      { to: locations.repeatedParams2.string },
      locations.repeatedParams2.normalized
    )
    expect(wrapper.find('a')!.className).toBe('')
  })

  it('can be active as an alias', async () => {
    let { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
    wrapper = (
      await factory(
        locations.alias.normalized,
        { to: locations.basic.string },
        locations.basic.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
  })

  it('is active when a child is active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('only the children is exact-active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
  })

  it('child is not active if the parent is active', async () => {
    const { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.find('a')!.className).not.toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active when a child is active', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
    wrapper = (
      await factory(
        locations.childDoubleAlias.normalized,
        { to: locations.parentAlias.string },
        locations.parentAlias.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active', async () => {
    let { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')

    wrapper = (
      await factory(
        locations.parentAlias.normalized,
        { to: locations.parent.string },
        locations.parent.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
  })

  it('child and parent with alias', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.childDoubleAlias.string },
      locations.childDoubleAlias.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')

    wrapper = (
      await factory(
        locations.child.normalized,
        { to: locations.childParentAlias.string },
        locations.childParentAlias.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.className).toContain('router-link-active')
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
  })

  it('can be exact-active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.className).toContain('router-link-exact-active')
  })

  it('calls ensureLocation', async () => {
    const { router } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(router.resolve).toHaveBeenCalledTimes(1)
    expect(router.resolve).toHaveBeenCalledWith(locations.basic.string)
  })

  it('calls router.push when clicked', async () => {
    const { router, wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    wrapper.find('a')!.click()
    await nextTick()
    expect(router.push).toHaveBeenCalledTimes(1)
  })

  it('calls router.push with the correct location for aliases', async () => {
    const { router, wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    wrapper.find('a')!.click()
    await nextTick()
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).not.toHaveBeenCalledWith(
      expect.objectContaining({
        // this is the original name but if we push with this location, we will
        // not have the alias on the url
        name: 'home',
      })
    )
  })

  describe('v-slot', () => {
    const slotTemplate = `
        <span>
          route: {{ JSON.stringify(route) }}
          href: "{{ href }}"
          isActive: "{{ isActive }}"
          isExactActive: "{{ isExactActive }}"
        </span>
    `

    it('provides information on v-slot', async () => {
      const { wrapper } = await factory(
        locations.basic.normalized,
        { to: locations.basic.string },
        locations.basic.normalized,
        slotTemplate
      )

      expect(wrapper.html()).toMatchSnapshot()
    })

    it('renders an anchor by default', async () => {
      const { wrapper } = await factory(
        locations.basic.normalized,
        { to: locations.basic.string },
        locations.basic.normalized,
        slotTemplate
      )

      expect(wrapper.rootEl.children[0].tagName).toBe('A')
      expect(wrapper.rootEl.children).toHaveLength(1)
    })

    it('can customize the rendering and remove the wrapping `a`', async () => {
      const { wrapper } = await factory(
        locations.basic.normalized,
        { to: locations.basic.string, custom: true },
        locations.basic.normalized,
        slotTemplate
      )

      expect(wrapper.html()).not.toContain('</a>')
    })
  })
})
