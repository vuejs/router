/**
 * @jest-environment jsdom
 */
import RouterView from '../src/components/View'
import { components } from './utils'
import {
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
} from '../src/types'
import { ref, markNonReactive } from 'vue'
import { mount } from './mount'

const routes: Record<string, RouteLocationNormalized> = {
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
  function factory(route: RouteLocationNormalized, props: any = {}) {
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
    const { el } = factory(START_LOCATION_NORMALIZED)
    // NOTE: I wonder if this will stay stable in future releases
    expect(el.innerHTML).toBe(`<!--fragment-0-start--><!--fragment-0-end-->`)
  })

  // TODO: nested routes
  it.skip('displays nested views', () => {
    const { el } = factory(routes.nested)
    expect(el.innerHTML).toBe(`<div><h2>Nested</h2><div>Foo</div></div>`)
  })

  it.skip('displays deeply nested views', () => {
    const { el } = factory(routes.nestedNested)
    expect(el.innerHTML).toBe(
      `<div><h2>Nested</h2><div><h2>Nested</h2><div>Foo</div></div></div>`
    )
  })
})
