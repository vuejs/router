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
}

describe('RouterView', () => {
  // skip these tests on mocha because @vue/test-utils
  // do not work correctly
  if (isMocha()) return
  const { mount } = require('@vue/test-utils')

  /**
   *
   * @param {RouteLocationNormalized} $route
   */
  function factory($route) {
    // @ts-ignore
    const wrapper = mount(RouterView, {
      mocks: { $route },
    })
    return wrapper
  }

  it('displays current route component', async () => {
    const wrapper = factory(routes.root)
    expect(wrapper.html()).toMatchInlineSnapshot(`"<div>Home</div>"`)
  })
})
