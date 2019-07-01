/**
 * @jest-environment jsdom
 *
 */
// @ts-check
require('./helper')
const expect = require('expect')
const { default: RouterView } = require('../src/components/View')
const { components, isMocha } = require('./utils')
const { START_LOCATION_NORMALIZED } = require('../src/types')

/** @typedef {import('../src/types').RouteLocationNormalized} RouteLocationNormalized */

/** @type {Record<string, RouteLocationNormalized>} */
const routes = {
  root: {
    fullPath: '/',
    name: undefined,
    path: '/',
    query: {},
    params: {},
    hash: '',
    // meta: {},
    matched: [{ components: { default: components.Home }, path: '/' }],
  },
  nested: {
    fullPath: '/a',
    name: undefined,
    path: '/a',
    query: {},
    params: {},
    hash: '',
    // meta: {},
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
    // meta: {},
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
    // meta: {},
    matched: [{ components: { foo: components.Foo }, path: '/' }],
  },
}

describe('RouterView', () => {
  // skip these tests on mocha because @vue/test-utils
  // do not work correctly
  if (isMocha()) return
  const { mount } = require('@vue/test-utils')

  /**
   *
   * @param {RouteLocationNormalized} $route
   * @param {Object} [props]
   */
  function factory($route, props = {}) {
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
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Home</div>"`)
  })

  it('displays named views', async () => {
    const wrapper = factory(routes.named, { name: 'foo' })
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Foo</div>"`)
  })

  it('displays nothing when route is unmatched', async () => {
    const wrapper = factory(START_LOCATION_NORMALIZED)
    // NOTE: I wonder if this will stay stable in future releases
    expect(wrapper.html()).toMatchInlineSnapshot(`undefined`)
  })

  it('displays nested views', async () => {
    const wrapper = factory(routes.nested)
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><h2>Nested</h2><div>Foo</div></div>"`
    )
  })

  it('displays deeply nested views', async () => {
    const wrapper = factory(routes.nestedNested)
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<div><h2>Nested</h2><div><h2>Nested</h2><div>Foo</div></div></div>"`
    )
  })
})
