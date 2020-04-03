/**
 * @jest-environment jsdom
 */
import { View as RouterView } from '../src/components/View'
import { components, RouteLocationNormalizedLoose } from './utils'
import { START_LOCATION_NORMALIZED } from '../src/types'
import { ref, markNonReactive } from 'vue'
import { mount, tick } from './mount'
import { mockWarn } from 'jest-mock-warn'

// to have autocompletion
function createRoutes<T extends Record<string, RouteLocationNormalizedLoose>>(
  routes: T
): T {
  return routes
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

  function factory(route: RouteLocationNormalizedLoose, props: any = {}) {
    const router = {
      currentRoute: ref(
        markNonReactive({
          ...route,
          // reset the instances every time
          matched: route.matched.map(match => ({ ...match, instances: {} })),
        })
      ),
    }

    const { app, el } = mount(
      router as any,
      {
        template: `<RouterView :name="name"></RouterView>`,
        components: { RouterView },
        setup() {
          const name = ref(props.name)

          return {
            name,
          }
        },
      } as any
    )

    return { app, router, el }
  }

  it('displays current route component', () => {
    const { el } = factory(routes.root)
    expect(el.innerHTML).toBe(`<div>Home</div>`)
  })

  it('displays named views', () => {
    const { el } = factory(routes.named, { name: 'foo' })
    expect(el.innerHTML).toBe(`<div>Foo</div>`)
  })

  it('displays nothing when route is unmatched', () => {
    const { el } = factory(START_LOCATION_NORMALIZED as any)
    // NOTE: I wonder if this will stay stable in future releases
    expect('Router').not.toHaveBeenWarned()
    expect(el.childElementCount).toBe(0)
  })

  it('displays nested views', () => {
    const { el } = factory(routes.nested)
    expect(el.innerHTML).toBe(`<div><h2>Nested</h2><div>Foo</div></div>`)
  })

  it('displays deeply nested views', () => {
    const { el } = factory(routes.nestedNested)
    expect(el.innerHTML).toBe(
      `<div><h2>Nested</h2><div><h2>Nested</h2><div>Foo</div></div></div>`
    )
  })

  it('renders when the location changes', async () => {
    const { el, router } = factory(routes.root)
    expect(el.innerHTML).toBe(`<div>Home</div>`)
    router.currentRoute.value = routes.foo
    await tick()
    expect(el.innerHTML).toBe(`<div>Foo</div>`)
  })

  it('does not pass params as props by default', async () => {
    let noPropsWithParams = {
      ...routes.withParams,
      matched: [{ ...routes.withParams.matched[0], props: false }],
    }
    const { el, router } = factory(noPropsWithParams)
    expect(el.innerHTML).toBe(`<div>User: default</div>`)
    router.currentRoute.value = { ...noPropsWithParams, params: { id: '4' } }
    await tick()
    expect(el.innerHTML).toBe(`<div>User: default</div>`)
  })

  it('passes params as props with props: true', async () => {
    const { el, router } = factory(routes.withParams)
    expect(el.innerHTML).toBe(`<div>User: 1</div>`)
    router.currentRoute.value = { ...routes.withParams, params: { id: '4' } }
    await tick()
    expect(el.innerHTML).toBe(`<div>User: 4</div>`)
  })

  it('can pass an object as props', async () => {
    const { el } = factory(routes.withIdAndOther)
    expect(el.innerHTML).toBe(`<div>id:foo;other:fixed</div>`)
  })

  it('can pass a function as props', async () => {
    const { el } = factory(routes.withFnProps)
    expect(el.innerHTML).toBe(`<div>id:2;other:page</div>`)
  })
})
