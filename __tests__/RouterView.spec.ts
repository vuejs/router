/**
 * @jest-environment jsdom
 */
import { RouterView } from '../src/components/View'
import { components, RouteLocationNormalizedLoose } from './utils'
import { START_LOCATION_NORMALIZED } from '../src/types'
import { markRaw } from 'vue'
import { mount, createMockedRoute } from './mount'
import { mockWarn } from 'jest-mock-warn'

// to have autocompletion
function createRoutes<T extends Record<string, RouteLocationNormalizedLoose>>(
  routes: T
): T {
  let nonReactiveRoutes: T = {} as T

  for (let key in routes) {
    nonReactiveRoutes[key] = markRaw(routes[key])
  }

  return nonReactiveRoutes
}

const routes = createRoutes({
  root: {
    fullPath: '/',
    name: undefined,
    path: '/',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [
      { components: { default: components.Home }, instances: {}, path: '/' },
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
      { components: { default: components.Foo }, instances: {}, path: '/foo' },
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
      { components: { default: components.Nested }, instances: {}, path: '/' },
      { components: { default: components.Foo }, instances: {}, path: 'a' },
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
      { components: { default: components.Nested }, instances: {}, path: '/' },
      { components: { default: components.Nested }, instances: {}, path: 'a' },
      { components: { default: components.Foo }, instances: {}, path: 'b' },
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
      { components: { foo: components.Foo }, instances: {}, path: '/' },
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
        path: '/users/:id',
        props: true,
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
        path: '/props/:id',
        props: { id: 'foo', other: 'fixed' },
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
        path: '/props/:id',
        props: to => ({ id: Number(to.params.id) * 2, other: to.query.q }),
      },
    ],
  },
})

describe('RouterView', () => {
  mockWarn()

  async function factory(
    initialRoute: RouteLocationNormalizedLoose,
    propsData: any = {}
  ) {
    const route = createMockedRoute(initialRoute)
    const wrapper = await mount(RouterView, {
      propsData,
      provide: route.provides,
      components: { RouterView },
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
    expect(wrapper.rootEl.childElementCount).toBe(0)
  })

  it('displays nested views', async () => {
    const { wrapper } = await factory(routes.nested)
    expect(wrapper.html()).toBe(`<div><h2>Nested</h2><div>Foo</div></div>`)
  })

  it('displays deeply nested views', async () => {
    const { wrapper } = await factory(routes.nestedNested)
    expect(wrapper.html()).toBe(
      `<div><h2>Nested</h2><div><h2>Nested</h2><div>Foo</div></div></div>`
    )
  })

  it('renders when the location changes', async () => {
    const { route, wrapper } = await factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div>`)
    await route.set(routes.foo)
    expect(wrapper.html()).toBe(`<div>Foo</div>`)
  })

  it('does not pass params as props by default', async () => {
    // TODO: rewrite so it is by default instead of explicitly stated
    let noPropsWithParams = {
      ...routes.withParams,
      matched: [{ ...routes.withParams.matched[0], props: false }],
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

  it('can pass a function as props', async () => {
    const { wrapper } = await factory(routes.withFnProps)
    expect(wrapper.html()).toBe(`<div>id:2;other:page</div>`)
  })
})
