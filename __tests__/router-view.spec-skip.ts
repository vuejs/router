/**
 * @jest-environment jsdom
 */
// NOTE: these tests only run when using jest `yarn jest --watch`
import RouterView from '../src/components/View'
import { components } from './utils'
import {
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
} from '../src/types'
import { mount } from '@vue/test-utils'

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
  function factory($route: RouteLocationNormalized, props: any = {}) {
    // @ts-ignore cannot mount functional component?
    const wrapper = mount(RouterView, {
      context: {
        // https://github.com/vuejs/vue-test-utils/issues/918
        props,
      },
      stubs: { RouterView },
      mocks: { $route },
    })
    return wrapper
  }

  it('displays current route component', async () => {
    const wrapper = factory(routes.root)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays named views', async () => {
    const wrapper = factory(routes.named, { name: 'foo' })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays nothing when route is unmatched', async () => {
    const wrapper = factory(START_LOCATION_NORMALIZED)
    // NOTE: I wonder if this will stay stable in future releases
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays nested views', async () => {
    const wrapper = factory(routes.nested)
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays deeply nested views', async () => {
    const wrapper = factory(routes.nestedNested)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
