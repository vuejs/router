/**
 * @vitest-environment happy-dom
 */
import { VaporRouterView } from '../src/VaporRouterView'
import { RouteLocationNormalizedLoose, vaporComponents } from './utils'
import { START_LOCATION_NORMALIZED } from '../src/location'
import {
  createComponentWithFallback,
  createDynamicComponent,
  createVaporApp,
  markRaw,
  renderEffect,
  resolveComponent,
  setText,
  template,
  txt,
  VaporComponentOptions,
  VaporKeepAlive,
  withVaporCtx,
} from 'vue'
import { createMockedRoute } from './mount'
import { RouteLocationNormalized } from '../src'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
        components: { default: vaporComponents.Home },
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
        components: { default: vaporComponents.Foo },
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
        components: { default: vaporComponents.Nested },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
      {
        components: { default: vaporComponents.Foo },
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
        components: { default: vaporComponents.Nested },
        instances: {},
        enterCallbacks: {},
        path: '/',
        props,
      },
      {
        components: { default: vaporComponents.Nested },
        instances: {},
        enterCallbacks: {},
        path: 'a',
        props,
      },
      {
        components: { default: vaporComponents.Foo },
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
        components: { foo: vaporComponents.Foo },
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
        components: { default: vaporComponents.User },

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
        components: { default: vaporComponents.WithProps },

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
        components: { default: vaporComponents.WithProps },

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
        components: { default: vaporComponents.Foo },
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

  let element = undefined as unknown as Element
  beforeEach(() => {
    element = document.createElement('div')
    element.setAttribute('id', 'host')
    document.body.appendChild(element)
  })
  afterEach(() => {
    element?.remove()
  })

  function mount(
    comp: VaporComponentOptions,
    props: any = {},
    provides: any = {}
  ) {
    const app = createVaporApp(comp, props || {})
    app._context.provides = provides
    app._context.components = {
      RouterView: VaporRouterView,
      KeepAlive: VaporKeepAlive,
    }
    app.mount(element)
    return {
      element,
      html: () => element.innerHTML,
    }
  }

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

  it('displays current route component', async () => {
    const { wrapper } = factory(routes.root)
    expect(wrapper.html()).toBe(`<div>Home</div><!--dynamic-component-->`)
  })

  it('displays named views', async () => {
    const { wrapper } = factory(routes.named, { name: 'foo' })
    expect(wrapper.html()).toBe(`<div>Foo</div><!--dynamic-component-->`)
  })

  it('displays nothing when route is unmatched', async () => {
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

  it('displays nested views', async () => {
    const { wrapper } = factory(routes.nested)
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><h2>Nested</h2><div>Foo</div><!--dynamic-component--><!--if--></div><!--dynamic-component-->"`
    )
  })

  it('displays deeply nested views', async () => {
    const { wrapper } = factory(routes.nestedNested)
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><h2>Nested</h2><div><h2>Nested</h2><div>Foo</div><!--dynamic-component--><!--if--></div><!--dynamic-component--><!--if--></div><!--dynamic-component-->"`
    )
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
          components: { default: vaporComponents.User },
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
      const route = createMockedRoute(routes.root)
      const wrapper = mount(
        {
          setup: () => {
            const component_router_view = resolveComponent('router-view')
            const n3 = createComponentWithFallback(
              component_router_view as any,
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
      expect(wrapper.html()).toMatchInlineSnapshot(
        `"<span>home</span><div>Home</div><!--dynamic-component-->"`
      )
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
      expect(wrapper.html()).toMatchInlineSnapshot(
        `"<div>Home</div><!--dynamic-component-->"`
      )
      await route.set(routes.foo)
      expect(wrapper.html()).toMatchInlineSnapshot(
        `"<div>Foo</div><!--dynamic-component-->"`
      )
    })
  })

  // Vapor mode doesn't support Suspense component yet.
  describe.todo('Suspense')
})
