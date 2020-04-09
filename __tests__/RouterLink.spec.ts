/**
 * @jest-environment jsdom
 */
import { Link as RouterLink } from '../src/components/Link'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocationRaw,
  RouteLocationNormalized,
  RouteLocation,
} from '../src/types'
import { createMemoryHistory } from '../src'
import { mount } from './mount'
import { ref, markNonReactive, nextTick } from 'vue'
import { RouteRecordNormalized } from '../src/matcher/types'
import { routerKey } from '../src/utils/injectionSymbols'

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

const locations: Record<
  string,
  {
    string: string
    normalized: RouteLocationNormalized
    toResolve?: MatcherLocationRaw & Required<RouteQueryAndHash>
  }
> = {
  basic: {
    string: '/home',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home',
      path: '/home',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.home],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  foo: {
    string: '/foo',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/foo',
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
      path: '/alias',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.homeAlias],
      redirectedFrom: undefined,
      name: undefined,
    },
  },

  // nested routes
  parent: {
    string: '/parent',
    normalized: {
      fullPath: '/parent',
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
  resolvedLocation: RouteLocation,
  slotTemplate: string = ''
) {
  // const route = createMockedRoute(initialRoute)
  const router = {
    history: createMemoryHistory(),
    createHref(to: RouteLocationNormalized): string {
      return this.history.base + to.fullPath
    },
    resolve: jest.fn(),
    push: jest.fn().mockResolvedValue(resolvedLocation),
    currentRoute: ref(markNonReactive(currentLocation)),
  }
  router.resolve.mockReturnValueOnce(resolvedLocation)

  const wrapper = await mount(RouterLink, {
    propsData,
    provide: {
      [routerKey as any]: router,
    },
    slots: { default: slotTemplate },
  })

  return { router, wrapper }
}

describe('RouterLink', () => {
  it('displays a link with a string prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.getAttribute('href')).toBe(
      '/home'
    )
  })

  it('displays a link with a string prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.getAttribute('href')).toBe(
      '/home'
    )
  })

  it('can change the value', async () => {
    const to = ref(locations.basic.string)
    const { wrapper, router } = await factory(
      START_LOCATION_NORMALIZED,
      { to },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.getAttribute('href')).toBe(
      '/home'
    )
    router.resolve.mockReturnValueOnce(locations.foo.normalized)
    to.value = locations.foo.string
    await nextTick()
    expect(wrapper.rootEl.querySelector('a')!.getAttribute('href')).toBe('/foo')
  })

  it('displays a link with an object with path prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.getAttribute('href')).toBe(
      '/home'
    )
  })

  it('can be active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
  })

  it('can customize active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, activeClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain('is-active')
  })

  it('can customize exact active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, exactActiveClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain('is-active')
  })

  it('can be active with custom class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, class: 'nav-item' },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain('nav-item')
  })

  it('is not active on a non matched location', async () => {
    const { wrapper } = await factory(
      locations.notFound.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toBe('')
  })

  it('is not active with more repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams2.normalized,
      { to: locations.repeatedParams3.string },
      locations.repeatedParams3.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toBe('')
  })

  it('is not active with partial repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams3.normalized,
      { to: locations.repeatedParams2.string },
      locations.repeatedParams2.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toBe('')
  })

  it('can be active as an alias', async () => {
    let { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
    wrapper = (
      await factory(
        locations.alias.normalized,
        { to: locations.basic.string },
        locations.basic.normalized
      )
    ).wrapper
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('is active when a child is active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('only the children is exact-active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('child is not active if the parent is active', async () => {
    const { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active when a child is active', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
    wrapper = (
      await factory(
        locations.childDoubleAlias.normalized,
        { to: locations.parentAlias.string },
        locations.parentAlias.normalized
      )
    ).wrapper
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active', async () => {
    let { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )

    wrapper = (
      await factory(
        locations.parentAlias.normalized,
        { to: locations.parent.string },
        locations.parent.normalized
      )
    ).wrapper
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('child and parent with alias', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.childDoubleAlias.string },
      locations.childDoubleAlias.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )

    wrapper = (
      await factory(
        locations.child.normalized,
        { to: locations.childParentAlias.string },
        locations.childParentAlias.normalized
      )
    ).wrapper
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-active'
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
  })

  it('can be exact-active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.rootEl.querySelector('a')!.className).toContain(
      'router-link-exact-active'
    )
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
    wrapper.rootEl.querySelector('a')!.click()
    await nextTick()
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith(locations.basic.normalized)
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
