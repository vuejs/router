/**
 * @jest-environment jsdom
 */
import { View as RouterView } from '../src/components/View'
import { components, RouteLocationNormalizedLoose } from './utils'
import { START_LOCATION_NORMALIZED } from '../src/types'
import { ref, markNonReactive } from 'vue'
import { mount, tick } from './mount'

const routes: Record<string, RouteLocationNormalizedLoose> = {
  root: {
    fullPath: '/',
    name: undefined,
    path: '/',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [{ components: { default: components.Home }, path: '/' }],
  },
  foo: {
    fullPath: '/foo',
    name: undefined,
    path: '/foo',
    query: {},
    params: {},
    hash: '',
    meta: {},
    matched: [{ components: { default: components.Foo }, path: '/foo' }],
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
      { components: { default: components.Nested }, path: '/' },
      { components: { default: components.Foo }, path: 'a' },
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
      { components: { default: components.Nested }, path: '/' },
      { components: { default: components.Nested }, path: 'a' },
      { components: { default: components.Foo }, path: 'b' },
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
    matched: [{ components: { foo: components.Foo }, path: '/' }],
  },
}

describe('RouterView', () => {
  function factory(route: RouteLocationNormalizedLoose, props: any = {}) {
    const router = {
      currentRoute: ref(markNonReactive(route)),
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
})
