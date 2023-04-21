/**
 * @jest-environment jsdom
 */
import { RouterView } from '../src/RouterView'
import { components, RouteLocationNormalizedLoose } from './utils'
import {
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
} from '../src/types'
import { markRaw } from 'vue'
import { createMockedRoute } from './mount'
import { mockWarn } from 'jest-mock-warn'
import { mount } from '@vue/test-utils'

// to have autocompletion
function createRoutes<T extends Record<string, RouteLocationNormalizedLoose>>(
  routes: T
): T {
  let nonReactiveRoutes: T = {} as T

  for (let key in routes) {
    nonReactiveRoutes[key] = markRaw(routes[key])
    nonReactiveRoutes[key].matched.forEach(record => {
      record.leaveGuards ??= new Set()
      record.updateGuards ??= new Set()
    })
  }

  return nonReactiveRoutes
}

const props = { default: false }

const routes = createRoutes({
  root: {
    fullPath: '/',
    name: 'home',
    path: '/',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.Home },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
    ],
  },
  foo: {
    fullPath: '/foo',
    name: undefined,
    path: '/foo',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.Foo },
        instances: {},
        enterCallbacks: {},
        path: '/foo',
        props,
      },
    ],
  },
  nested: {
    fullPath: '/a',
    name: undefined,
    path: '/a',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.Nested },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
      {
        components: { default: components.Foo },
        instances: {},
        enterCallbacks: {},
        path: 'a',
        props,
      },
    ],
  },
  nestedNested: {
    fullPath: '/a/b',
    name: undefined,
    path: '/a/b',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.Nested },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
      {
        components: { default: components.Nested },
        instances: {},
        enterCallbacks: {},
        path: 'a',
        props,
      },
      {
        components: { default: components.Foo },
        instances: {},
        enterCallbacks: {},
        path: 'b',
        props,
      },
    ],
  },
  named: {
    fullPath: '/',
    name: undefined,
    path: '/',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: { foo: components.Foo },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
    ],
  },
  withParams: {
    fullPath: '/users/1',
    name: undefined,
    path: '/users/1',
    query: {},
    params: { id: '1' },
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.User },

        instances: {},
        enterCallbacks: {},
        path: '/users/:id',
        props: { default: true },
      },
    ],
  },
  withIdAndOther: {
    fullPath: '/props/1',
    name: undefined,
    path: '/props/1',
    query: {},
    params: { id: '1' },
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.WithProps },

        instances: {},
        enterCallbacks: {},
        path: '/props/:id',
        props: { default: { id: 'foo', other: 'fixed' } },
      },
    ],
  },

  withFnProps: {
    fullPath: '/props/1',
    name: undefined,
    path: '/props/1',
    query: { q: 'page' },
    params: { id: '1' },
    hash: '',
    meta: {},
    matched: [
      {
        components: { default: components.WithProps },

        instances: {},
        enterCallbacks: {},
        path: '/props/:id',
        props: {
          default: (to: RouteLocationNormalized) => ({
            id: Number(to.params.id) * 2,
            other: to.query.q,
          }),
        },
      },
    ],
  },

  passthrough: {
    fullPath: '/foo',
    name: undefined,
    path: '/foo',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      {
        components: null,
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
      {
        components: { default: components.Foo },
        instances: {},
        enterCallbacks: {},
        path: 'foo',
        props,
      },
    ],
  },
})

describe('RouterView', () => {
  mockWarn()

  async function factory(
    initialRoute: RouteLocationNormalizedLoose,
    props: any = {}
  ) {
    const route = createMockedRoute(initialRoute)
    const wrapper = mount(RouterView as any, {
      props,
      global: {
        provide: route.provides,
        components: { RouterView },
      },
    })

    return { route, wrapper }
  }

  it('displays current route component', async () => {
    const { wrapper } = await factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div>`)
  })

  it('displays named views', async () => {
    const { wrapper } = await factory(routes.named, { name: 'foo' })
    expect(wrapper.html()).toBe(`<div>Foo</div>`)
  })

  it('displays nothing when route is unmatched', async () => {
    const { wrapper } = await factory(START_LOCATION_NORMALIZED as any)
    // NOTE: I wonder if this will stay stable in future releases
    expect('Router').not.toHaveBeenWarned()
    expect(wrapper.element.childNodes).toHaveLength(0)
  })

  it('displays nested views', async () => {
    const { wrapper } = await factory(routes.nested)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays deeply nested views', async () => {
    const { wrapper } = await factory(routes.nestedNested)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders when the location changes', async () => {
    const { route, wrapper } = await factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div>`)
    await route.set(routes.foo)
    expect(wrapper.html()).toBe(`<div>Foo</div>`)
  })

  it('does not pass params as props by default', async () => {
    let noPropsWithParams = {
      ...routes.withParams,
      matched: [
        {
          components: { default: components.User },
          instances: {},
          enterCallbacks: {},
          path: '/users/:id',
          props,
        },
      ],
    }
    const { wrapper, route } = await factory(noPropsWithParams)
    expect(wrapper.html()).toBe(`<div>User: default</div>`)
    await route.set({
      ...noPropsWithParams,
      params: { id: '4' },
    })
    expect(wrapper.html()).toBe(`<div>User: default</div>`)
  })

  it('passes params as props with props: true', async () => {
    const { wrapper, route } = await factory(routes.withParams)
    expect(wrapper.html()).toBe(`<div>User: 1</div>`)
    await route.set({
      ...routes.withParams,
      params: { id: '4' },
    })
    expect(wrapper.html()).toBe(`<div>User: 4</div>`)
  })

  it('can pass an object as props', async () => {
    const { wrapper } = await factory(routes.withIdAndOther)
    expect(wrapper.html()).toBe(`<div>id:foo;other:fixed</div>`)
  })

  it('inherit attributes', async () => {
    const { wrapper } = await factory(routes.withIdAndOther, {
      'data-test': 'true',
    })
    expect(wrapper.html()).toBe(
      `<div data-test="true">id:foo;other:fixed</div>`
    )
  })

  it('can pass a function as props', async () => {
    const { wrapper } = await factory(routes.withFnProps)
    expect(wrapper.html()).toBe(`<div>id:2;other:page</div>`)
  })

  it('pass through with empty children', async () => {
    const { wrapper } = await factory(routes.passthrough)
    expect(wrapper.html()).toBe(`<div>Foo</div>`)
  })

  describe('warnings', () => {
    it('does not warn RouterView is wrapped', () => {
      const route = createMockedRoute(routes.root)
      const wrapper = mount(
        {
          template: `<div><router-view/></div>`,
        },
        {
          props: {},
          global: {
            provide: route.provides,
            components: { RouterView },
          },
        }
      )
      expect(wrapper.html()).toMatchSnapshot()
      expect('can no longer be used directly inside').not.toHaveBeenWarned()
    })

    it('warns if KeepAlive wraps a RouterView', () => {
      const route = createMockedRoute(routes.root)
      const wrapper = mount(
        {
          template: `
        <keep-alive>
          <router-view/>
        </keep-alive>
        `,
        },
        {
          props: {},
          global: {
            provide: route.provides,
            components: { RouterView },
          },
        }
      )
      expect(wrapper.html()).toBe(`<div>Home</div>`)
      expect('can no longer be used directly inside').toHaveBeenWarned()
    })

    it('warns if KeepAlive and Transition wrap a RouterView', async () => {
      const route = createMockedRoute(routes.root)
      const wrapper = mount(
        {
          template: `
        <transition>
          <keep-alive>
            <router-view/>
          </keep-alive>
        </transition>
        `,
        },
        {
          props: {},
          global: {
            stubs: {
              transition: false,
            },
            provide: route.provides,
            components: { RouterView },
          },
        }
      )
      expect(wrapper.html()).toBe(`<div>Home</div>`)
      expect('can no longer be used directly inside').toHaveBeenWarned()
    })

    it('does not warn if RouterView is not a direct-child of transition', async () => {
      const route = createMockedRoute(routes.root)
      mount(
        {
          template: `
        <transition>
          <div>
            <router-view/>
          </div>
        </transition>
        `,
        },
        {
          props: {},
          global: {
            stubs: {
              transition: false,
            },
            provide: route.provides,
            components: { RouterView },
          },
        }
      )
      expect('can no longer be used directly inside').not.toHaveBeenWarned()
    })

    it('warns if Transition wraps a RouterView', () => {
      const route = createMockedRoute(routes.root)
      const wrapper = mount(
        {
          template: `
        <transition>
          <router-view/>
        </transition>
        `,
        },
        {
          props: {},
          global: {
            stubs: {
              transition: false,
            },
            provide: route.provides,
            components: { RouterView },
          },
        }
      )
      expect(wrapper.html()).toBe(`<div>Home</div>`)
      expect('can no longer be used directly inside').toHaveBeenWarned()
    })
  })

  describe('v-slot', () => {
    async function factory(
      initialRoute: RouteLocationNormalizedLoose,
      props: any = {}
    ) {
      const route = createMockedRoute(initialRoute)
      const wrapper = await mount(RouterView as any, {
        props,
        global: {
          provide: route.provides,
          components: { RouterView },
        },
        slots: {
          default: `
            <template #default="{ route, Component }">
              <span>{{ route.name }}</span>
              <component :is="Component"/>
            </template>
            `,
        },
      })

      return { route, wrapper }
    }

    it('passes a Component and route', async () => {
      const { wrapper } = await factory(routes.root)
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('KeepAlive', () => {
    async function factory(
      initialRoute: RouteLocationNormalizedLoose,
      props: any = {}
    ) {
      const route = createMockedRoute(initialRoute)
      const wrapper = await mount(RouterView as any, {
        props,
        global: {
          provide: route.provides,
          components: { RouterView },
        },
        slots: {
          default: `
          <template #default="{ Component }">
            <keep-alive>
              <component :is="Component"/>
            </keep-alive>
          </template>`,
        },
      })

      return { route, wrapper }
    }

    it('works', async () => {
      const { route, wrapper } = await factory(routes.root)
      expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Home</div>"`)
      await route.set(routes.foo)
      expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Foo</div>"`)
    })
  })

  describe('Suspense', () => {
    async function factory(
      initialRoute: RouteLocationNormalizedLoose,
      props: any = {}
    ) {
      const route = createMockedRoute(initialRoute)
      const wrapper = await mount(RouterView as any, {
        props,
        global: {
          provide: route.provides,
          components: { RouterView },
        },
        slots: {
          default: `
          <template #default="{ Component }">
            <Suspense>
              <component :is="Component"/>
            </Suspense>
          </template>`,
        },
      })

      return { route, wrapper }
    }

    it('works', async () => {
      const { route, wrapper } = await factory(routes.root)
      expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Home</div>"`)
      await route.set(routes.foo)
      expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Foo</div>"`)
    })
  })
})
