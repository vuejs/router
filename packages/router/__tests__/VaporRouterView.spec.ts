/**
 * @vitest-environment happy-dom
 */
import { VaporRouterView } from '../src/VaporRouterView'
import { RouteLocationNormalizedLoose } from './utils'
import { START_LOCATION_NORMALIZED } from '../src/location'
import {
  createComponent,
  createComponentWithFallback,
  createDynamicComponent,
  createIf,
  defineVaporComponent,
  markRaw,
  renderEffect,
  resolveComponent,
  setInsertionState,
  setText,
  template,
  txt,
  withVaporCtx,
} from 'vue'
import { createMockedRoute, createVaporMount } from './mount'
import { RouteComponent, RouteLocationNormalized } from '../src'
import { describe, expect, it } from 'vitest'
import { mockWarn } from './vitest-mock-warn'

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

const components = {
  Home: { setup: () => template('<div>Home')() },
  Foo: { render: () => template('<div>Foo')() },
  Bar: { render: () => template('<div>Bar')() },
  User: defineVaporComponent({
    props: {
      id: {
        default: 'default',
      },
    },
    setup(props: any) {
      const n0 = template('<div> ', true)()
      const x0 = txt(n0 as any)
      renderEffect(() => setText(x0 as any, `User: ${props.id}`))
      return n0
    },
  }),
  WithProps: {
    props: {
      id: {
        default: 'default',
      },
      other: {
        default: 'other',
      },
    },
    setup(props: any) {
      const n0 = template('<div> ', true)()
      const x0 = txt(n0 as any)
      renderEffect(() =>
        setText(x0 as any, 'id:' + props.id + ';other:' + props.other)
      )
      return n0
    },
  } as RouteComponent,
  Nested: {
    render: () => {
      const n3 = template('<div><h2>Nested', true)()
      setInsertionState(n3 as any, null, 1, true)
      createIf(
        () => VaporRouterView,
        () => {
          const n2 = createComponent(VaporRouterView)
          return n2
        }
      )
      return n3
    },
  },
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

  const mount = createVaporMount()

  function factory(
    initialRoute: RouteLocationNormalizedLoose,
    props: any = {}
  ) {
    const route = createMockedRoute(initialRoute)
    return {
      route,
      wrapper: mount(VaporRouterView, props, route.provides),
    }
  }

  it('displays current route component', () => {
    const { wrapper } = factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div><!--dynamic-component-->`)
  })

  it('displays named views', () => {
    const { wrapper } = factory(routes.named, { name: 'foo' })
    expect(wrapper.html()).toBe(`<div>Foo</div><!--dynamic-component-->`)
  })

  it('displays nothing when route is unmatched', () => {
    const { wrapper } = factory(START_LOCATION_NORMALIZED as any)
    // NOTE: I wonder if this will stay stable in future releases
    expect('Router').not.toHaveBeenWarned()
    expect(
      // @ts-ignore
      [...wrapper.element.childNodes].filter(
        node => node.nodeType !== Node.COMMENT_NODE
      )
    ).toHaveLength(0)
  })

  it('displays nested views', () => {
    const { wrapper } = factory(routes.nested)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays deeply nested views', () => {
    const { wrapper } = factory(routes.nestedNested)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders when the location changes', async () => {
    const { route, wrapper } = factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div><!--dynamic-component-->`)
    await route.set(routes.foo)
    expect(wrapper.html()).toBe(`<div>Foo</div><!--dynamic-component-->`)
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
    const { wrapper, route } = factory(noPropsWithParams)
    expect(wrapper.html()).toBe(
      `<div>User: default</div><!--dynamic-component-->`
    )
    await route.set({
      ...noPropsWithParams,
      params: { id: '4' },
    })
    expect(wrapper.html()).toBe(
      `<div>User: default</div><!--dynamic-component-->`
    )
  })

  it('passes params as props with props: true', async () => {
    const { wrapper, route } = factory(routes.withParams)
    expect(wrapper.html()).toBe(`<div>User: 1</div><!--dynamic-component-->`)
    await route.set({
      ...routes.withParams,
      params: { id: '4' },
    })
    expect(wrapper.html()).toBe(`<div>User: 4</div><!--dynamic-component-->`)
  })

  it('can pass an object as props', () => {
    const { wrapper } = factory(routes.withIdAndOther)
    expect(wrapper.html()).toBe(
      `<div>id:foo;other:fixed</div><!--dynamic-component-->`
    )
  })

  it('inherit attributes', () => {
    const { wrapper } = factory(routes.withIdAndOther, {
      'data-test': 'true',
    })
    expect(wrapper.html()).toBe(
      `<div data-test="true">id:foo;other:fixed</div><!--dynamic-component-->`
    )
  })

  it('can pass a function as props', () => {
    const { wrapper } = factory(routes.withFnProps)
    expect(wrapper.html()).toBe(
      `<div>id:2;other:page</div><!--dynamic-component-->`
    )
  })

  it('pass through with empty children', () => {
    const { wrapper } = factory(routes.passthrough)
    expect(wrapper.html()).toBe(`<div>Foo</div><!--dynamic-component-->`)
  })

  describe('v-slot', () => {
    function factory(
      initialRoute: RouteLocationNormalizedLoose,
      props: any = {}
    ) {
      const route = createMockedRoute(initialRoute)
      const wrapper = mount(
        {
          setup: () => {
            const n3 = createComponentWithFallback(
              VaporRouterView,
              null,
              {
                default: withVaporCtx((_slotProps0: any) => {
                  const n0 = template('<span> ')()
                  const n1 = createDynamicComponent(() => _slotProps0.Component)
                  const x0 = txt(n0 as any)
                  renderEffect(() => setText(x0 as any, _slotProps0.route.name))
                  return [n0, n1]
                }),
              },
              true
            )
            return n3
          },
        },
        props,
        route.provides
      )
      return { route, wrapper }
    }
    it('passes a Component and route', () => {
      const { wrapper } = factory(routes.root)
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  describe('KeepAlive', () => {
    function factory(
      initialRoute: RouteLocationNormalizedLoose,
      props: any = {}
    ) {
      const route = createMockedRoute(initialRoute)
      const wrapper = mount(
        {
          setup: () => {
            const component_router_view = resolveComponent('router-view')
            const component_keep_alive = resolveComponent('keep-alive')
            const n1 = createComponentWithFallback(
              component_keep_alive as any,
              null,
              {
                default: () => {
                  const n0 = createComponentWithFallback(
                    component_router_view as any
                  )
                  return n0
                },
              },
              true
            )
            return n1
          },
        },
        props,
        route.provides
      )

      return { route, wrapper }
    }

    it('works', async () => {
      const { route, wrapper } = factory(routes.root)
      expect(wrapper.html()).toMatchSnapshot()
      await route.set(routes.foo)
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

  // Vapor mode doesn't support Suspense component yet.
  describe.todo('Suspense')
})
