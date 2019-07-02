/**
 * @jest-environment jsdom
 */
// @ts-check
// NOTE: these tests only run when using jest `yarn jest --watch`
require('./helper')
const expect = require('expect')
const { default: RouterLink } = require('../src/components/Link')
const { components, isMocha, HistoryMock } = require('./utils')
const { START_LOCATION_NORMALIZED } = require('../src/types')

/** @typedef {import('../src/types').RouteLocationNormalized} RouteLocationNormalized */
/** @typedef {import('../src/types').RouteRecord} RouteRecord */
/** @typedef {import('../src/types').RouteLocation} RouteLocation */
/** @typedef {import('../src/types').MatcherLocation} MatcherLocation */
/** @typedef {import('../src/types').RouteQueryAndHash} RouteQueryAndHash */

/** @type {Record<string, { string: string, normalized: RouteLocationNormalized, toResolve?: MatcherLocation & Required<RouteQueryAndHash> }>} */
const locations = {
  basic: {
    string: '/home',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home',
      path: '/home',
      params: {},
      // meta: {},
      query: {},
      hash: '',
      matched: [],
      name: undefined,
    },
  },
  withQuery: {
    string: '/home?foo=a&bar=b',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home?foo=a&bar=b',
      path: '/home',
      params: {},
      // meta: {},
      query: { foo: 'a', bar: 'b' },
      hash: '',
      matched: [],
      name: undefined,
    },
  },
}

describe('RouterLink', () => {
  // skip these tests on mocha because @vue/test-utils
  // do not work correctly
  if (isMocha()) return
  const { mount } = require('@vue/test-utils')

  /**
   *
   * @param {RouteLocationNormalized} currentLocation
   * @param {Object} propsData
   * @param {RouteLocationNormalized} resolvedLocation
   */
  function factory(currentLocation, propsData, resolvedLocation) {
    const router = {
      history: new HistoryMock(),
      resolveLocation: jest.fn(),
      push: jest.fn(),
    }

    router.resolveLocation.mockReturnValueOnce(resolvedLocation)
    // @ts-ignore TODO: Some information are missing on RouterLink
    const wrapper = mount(RouterLink, {
      propsData,
      slots: {
        default: 'a link',
      },
      // stubs: { RouterLink },
      mocks: { $route: currentLocation, $router: router },
    })
    return { wrapper, router }
  }

  it('displays a link with a string prop', () => {
    const { wrapper } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<a href=\\"/home\\">a link</a>"`
    )
  })

  it('displays a link with an object with path prop', () => {
    const { wrapper } = factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(wrapper.html()).toMatchInlineSnapshot(
      `"<a href=\\"/home\\">a link</a>"`
    )
  })

  it('calls ensureLocation', () => {
    const { router } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(router.resolveLocation).toHaveBeenCalledTimes(1)
    expect(router.resolveLocation).toHaveBeenCalledWith(
      expect.objectContaining({ path: locations.basic.string }),
      START_LOCATION_NORMALIZED
    )
  })

  it('calls router.push when clicked', () => {
    const { router, wrapper } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    wrapper.trigger('click', {})
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith(locations.basic.normalized)
  })

  it('normalizes query with path', () => {
    const { router } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.withQuery.string },
      locations.withQuery.normalized // it doesn't matter as we want to check what resolveLocation is called with
    )
    expect(router.resolveLocation).toHaveBeenCalledWith(
      expect.objectContaining({ query: locations.withQuery.normalized.query }),
      START_LOCATION_NORMALIZED
    )
  })
})
