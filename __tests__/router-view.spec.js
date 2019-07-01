/**
 * @jest-environment jsdom
 *
 */
// @ts-check
require('./helper')
const expect = require('expect')
const { default: RouterView } = require('../src/components/View')
const { components, isMocha } = require('./utils')

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
})
