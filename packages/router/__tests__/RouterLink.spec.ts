/**
 * @jest-environment jsdom
 */
import { RouterLink, RouterLinkProps } from '../src/RouterLink'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocationRaw,
  RouteLocationNormalized,
} from '../src/types'
import { createMemoryHistory, RouterOptions } from '../src'
import { createMockedRoute } from './mount'
import { defineComponent, PropType } from 'vue'
import { RouteRecordNormalized } from '../src/matcher/types'
import { routerKey } from '../src/injectionSymbols'
import { tick } from './utils'
import { mount } from '@vue/test-utils'

const records = {
  home: {} as RouteRecordNormalized,
  homeAlias: {} as RouteRecordNormalized,
  foo: {} as RouteRecordNormalized,
  parent: {} as RouteRecordNormalized,
  childEmpty: {} as RouteRecordNormalized,
  childEmptyAlias: {} as RouteRecordNormalized,
  child: {} as RouteRecordNormalized,
  childChild: {} as RouteRecordNormalized,
  parentAlias: {} as RouteRecordNormalized,
  childAlias: {} as RouteRecordNormalized,
}

// fix the aliasOf
records.homeAlias = { aliasOf: records.home } as RouteRecordNormalized
records.parentAlias = {
  aliasOf: records.parent,
} as RouteRecordNormalized
records.childAlias = { aliasOf: records.child } as RouteRecordNormalized
records.childEmptyAlias.aliasOf = records.childEmpty

type RouteLocationResolved = RouteLocationNormalized & { href: string }

function createLocations<
  T extends Record<
    string,
    {
      string: string
      normalized: RouteLocationResolved
      toResolve?: MatcherLocationRaw & Required<RouteQueryAndHash>
    }
  >
>(locs: T) {
  return locs
}

const locations = createLocations({
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
  singleStringParams: {
    string: '/p/1',
    normalized: {
      fullPath: '/p/1',
      href: '/p/1',
      path: '/p/1',
      params: { p: '1' },
      meta: {},
      query: {},
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
  anotherRepeatedParams2: {
    string: '/p/1/3',
    normalized: {
      fullPath: '/p/1/3',
      href: '/p/1/3',
      path: '/p/1/3',
      params: { p: ['1', '3'] },
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

  childEmpty: {
    string: '/parent',
    normalized: {
      fullPath: '/parent',
      href: '/parent',
      path: '/parent',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.childEmpty],
      redirectedFrom: undefined,
      name: undefined,
    },
  },
  childEmptyAlias: {
    string: '/parent/alias',
    normalized: {
      fullPath: '/parent/alias',
      href: '/parent/alias',
      path: '/parent/alias',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.childEmptyAlias],
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
  childChild: {
    string: '/parent/child/child',
    normalized: {
      fullPath: '/parent/child/child',
      href: '/parent/child/child',
      path: '/parent/child/child',
      params: {},
      meta: {},
      query: {},
      hash: '',
      matched: [records.parent, records.child, records.childChild],
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
})

// add paths to records because they are used to check isActive
for (let record in records) {
  let location = locations[record as keyof typeof locations]
  if (location) {
    records[record as keyof typeof records].path = location.normalized.path
  }
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
    options: {} as Partial<RouterOptions>,
    resolve: jest.fn(),
    push: jest.fn().mockResolvedValue(resolvedLocation),
    replace: jest.fn().mockResolvedValue(resolvedLocation),
  }
  router.resolve.mockReturnValueOnce(resolvedLocation)

  const wrapper = mount(RouterLink as any, {
    propsData,
    global: {
      provide: {
        [routerKey as any]: router,
        ...route.provides,
      },
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
    expect(wrapper.find('a')!.attributes('href')).toBe('/home')
  })

  it('can change the value', async () => {
    const { wrapper, router } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.attributes('href')).toBe('/home')
    router.resolve.mockReturnValueOnce(locations.foo.normalized)
    await wrapper.setProps({ to: locations.foo.string })
    expect(wrapper.find('a')!.attributes('href')).toBe('/foo')
  })

  it('displays a link with an object with path prop', async () => {
    const { wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.attributes('href')).toBe('/home')
  })

  it('can be active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a').classes()).toContain('router-link-active')
  })

  it('sets aria-current to page by default when exact active', async () => {
    const { wrapper, route } = await factory(
      locations.parent.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.find('a')!.attributes('aria-current')).toBe('page')
    route.set(locations.child.normalized)
    await tick()
    expect(wrapper.find('a')!.attributes('aria-current')).not.toBe('page')
  })

  it('can customize aria-current value', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, ariaCurrentValue: 'time' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.attributes('aria-current')).toBe('time')
  })

  it('can customize active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, activeClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).not.toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('is-active')
  })

  it('prop classes take over global', async () => {
    const { wrapper, router } = await factory(
      locations.basic.normalized,
      // wrong location to set it later
      {
        to: locations.foo.string,
        activeClass: 'is-active',
        exactActiveClass: 'is-exact',
      },
      locations.foo.normalized
    )
    router.options.linkActiveClass = 'custom'
    router.options.linkExactActiveClass = 'custom-exact'
    // force render because options is not reactive
    router.resolve.mockReturnValueOnce(locations.basic.normalized)
    await wrapper.setProps({ to: locations.basic.string })
    expect(wrapper.find('a')!.classes()).not.toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
    expect(wrapper.find('a')!.classes()).not.toContain('custom')
    expect(wrapper.find('a')!.classes()).not.toContain('custom-exact')
    expect(wrapper.find('a')!.classes()).toContain('is-active')
    expect(wrapper.find('a')!.classes()).toContain('is-exact')
  })

  it('can globally customize active class', async () => {
    const { wrapper, router } = await factory(
      locations.basic.normalized,
      // wrong location to set it later
      { to: locations.foo.string },
      locations.foo.normalized
    )
    router.options.linkActiveClass = 'custom'
    // force render because options is not reactive
    router.resolve.mockReturnValueOnce(locations.basic.normalized)
    await wrapper.setProps({ to: locations.basic.string })
    expect(wrapper.find('a')!.classes()).not.toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('custom')
  })

  it('can globally customize exact active class', async () => {
    const { wrapper, router } = await factory(
      locations.basic.normalized,
      // wrong location to set it later
      { to: locations.foo.string },
      locations.foo.normalized
    )
    router.options.linkExactActiveClass = 'custom'
    // force render because options is not reactive
    router.resolve.mockReturnValueOnce(locations.basic.normalized)
    await wrapper.setProps({ to: locations.basic.string })
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
    expect(wrapper.find('a')!.classes()).toContain('custom')
  })

  it('can customize exact active class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, exactActiveClass: 'is-active' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
    expect(wrapper.find('a')!.classes()).toContain('is-active')
  })

  it('can be active with custom class', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, class: 'nav-item' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('nav-item')
  })

  it('is not active on a non matched location', async () => {
    const { wrapper } = await factory(
      locations.notFound.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).toHaveLength(0)
  })

  it('is not active with different params type', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams2.normalized,
      { to: locations.singleStringParams.string },
      locations.singleStringParams.normalized
    )
    expect(wrapper.find('a')!.classes()).toHaveLength(0)
  })

  it('is not active with different repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams2.normalized,
      { to: locations.anotherRepeatedParams2.string },
      locations.anotherRepeatedParams2.normalized
    )
    expect(wrapper.find('a')!.classes()).toHaveLength(0)
  })

  it('is not active with more repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams2.normalized,
      { to: locations.repeatedParams3.string },
      locations.repeatedParams3.normalized
    )
    expect(wrapper.find('a')!.classes()).toHaveLength(0)
  })

  it('is not active with partial repeated params', async () => {
    const { wrapper } = await factory(
      locations.repeatedParams3.normalized,
      { to: locations.repeatedParams2.string },
      locations.repeatedParams2.normalized
    )
    expect(wrapper.find('a')!.classes()).toHaveLength(0)
  })

  it('can be active as an alias', async () => {
    let { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
    wrapper = (
      await factory(
        locations.alias.normalized,
        { to: locations.basic.string },
        locations.basic.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
  })

  it('is active when a child is active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('only the children is exact-active', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
  })

  it('child is not active if the parent is active', async () => {
    const { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.child.string },
      locations.child.normalized
    )
    expect(wrapper.find('a')!.classes()).not.toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parent.string },
      locations.parent.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('empty path child is active as if it was the parent when on adjacent child', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.childEmpty.string },
      locations.childEmpty.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias of empty path child is active as if it was the parent when on adjacent child', async () => {
    const { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.childEmptyAlias.string },
      locations.childEmptyAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('empty path child is active as if it was the parent when on adjacent nested child', async () => {
    const { wrapper } = await factory(
      locations.childChild.normalized,
      { to: locations.childEmpty.string },
      locations.childEmpty.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias of empty path child is active as if it was the parent when on adjacent nested nested child', async () => {
    const { wrapper } = await factory(
      locations.childChild.normalized,
      { to: locations.childEmptyAlias.string },
      locations.childEmptyAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active if the child is an absolute path', async () => {
    const { wrapper } = await factory(
      locations.childAsAbsolute.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active when a child is active', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
    wrapper = (
      await factory(
        locations.childDoubleAlias.normalized,
        { to: locations.parentAlias.string },
        locations.parentAlias.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).not.toContain(
      'router-link-exact-active'
    )
  })

  it('alias parent is active', async () => {
    let { wrapper } = await factory(
      locations.parent.normalized,
      { to: locations.parentAlias.string },
      locations.parentAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')

    wrapper = (
      await factory(
        locations.parentAlias.normalized,
        { to: locations.parent.string },
        locations.parent.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
  })

  it('child and parent with alias', async () => {
    let { wrapper } = await factory(
      locations.child.normalized,
      { to: locations.childDoubleAlias.string },
      locations.childDoubleAlias.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')

    wrapper = (
      await factory(
        locations.child.normalized,
        { to: locations.childParentAlias.string },
        locations.childParentAlias.normalized
      )
    ).wrapper
    expect(wrapper.find('a')!.classes()).toContain('router-link-active')
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
  })

  it('can be exact-active', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).toContain('router-link-exact-active')
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
    wrapper.find('a')!.trigger('click')
    expect(router.push).toHaveBeenCalledTimes(1)
  })

  it('allows adding more click listeners', async () => {
    const onClick = jest.fn()
    const { router, wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string, onClick },
      locations.basic.normalized
    )
    wrapper.find('a')!.trigger('click')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('allows adding custom classes', async () => {
    const { wrapper } = await factory(
      locations.basic.normalized,
      { to: locations.basic.string, class: 'custom class' },
      locations.basic.normalized
    )
    expect(wrapper.find('a')!.classes()).toEqual([
      'router-link-active',
      'router-link-exact-active',
      'custom',
      'class',
    ])
  })

  it('calls router.replace when clicked with replace prop', async () => {
    const { router, wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string, replace: true },
      locations.basic.normalized
    )
    wrapper.find('a')!.trigger('click')
    expect(router.replace).toHaveBeenCalledTimes(1)
  })

  it('calls router.push with the correct location for aliases', async () => {
    const { router, wrapper } = await factory(
      START_LOCATION_NORMALIZED,
      { to: locations.alias.string },
      locations.alias.normalized
    )
    wrapper.find('a')!.trigger('click')
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
      <template #default="{ route, href, isActive, isExactActive }">
        <span>
          route: {{ JSON.stringify(route) }}
          href: "{{ href }}"
          isActive: "{{ isActive }}"
          isExactActive: "{{ isExactActive }}"
        </span>
      </template>
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

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.element.childElementCount).toBe(1)
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

    describe('Extending RouterLink', () => {
      const AppLink = defineComponent({
        template: `
<a v-if="isExternalLink" v-bind="$attrs" :href="to">
  <slot />
</a>
<router-link v-else v-bind="$props" custom v-slot="{ isActive, href, navigate }">
  <a
    v-bind="$attrs"
    :href="href"
    @click="navigate"
    :class="isActive ? activeClass : inactiveClass"
  >
    <slot />
  </a>
</router-link>
        `,
        components: { RouterLink },
        name: 'AppLink',

        // @ts-expect-error
        props: {
          ...((RouterLink as any).props as RouterLinkProps),
          inactiveClass: String as PropType<string>,
        },

        computed: {
          isExternalLink(): boolean {
            // @ts-expect-error
            return typeof this.to === 'string' && this.to.startsWith('http')
          },
        },
      })

      async function factoryCustom(
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
          options: {} as Partial<RouterOptions>,
          resolve: jest.fn(),
          push: jest.fn().mockResolvedValue(resolvedLocation),
        }
        router.resolve.mockReturnValueOnce(resolvedLocation)

        const wrapper = await mount(AppLink as any, {
          propsData,
          global: {
            provide: {
              [routerKey as any]: router,
              ...route.provides,
            },
          },
          slots: { default: slotTemplate },
        })

        return { router, wrapper, route }
      }

      it('can extend RouterLink with inactive class', async () => {
        const { wrapper } = await factoryCustom(
          locations.basic.normalized,
          {
            to: locations.basic.string,
            inactiveClass: 'inactive',
            activeClass: 'active',
          },
          locations.foo.normalized
        )

        expect(wrapper.find('a')!.classes()).toEqual(['inactive'])
      })

      it('can extend RouterLink with external link', async () => {
        const { wrapper } = await factoryCustom(
          locations.basic.normalized,
          {
            to: 'https://esm.dev',
          },
          locations.foo.normalized
        )

        expect(wrapper.find('a')!.classes()).toHaveLength(0)
        expect(wrapper.find('a')!.attributes('href')).toEqual('https://esm.dev')
      })
    })
  })
})
