/**
 * @jest-environment jsdom
 */
// NOTE: these tests only run when using jest `yarn jest --watch`
import RouterLink from '../src/components/Link'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocation,
  RouteLocationNormalized,
} from '../src/types'
import { mount } from '@vue/test-utils'
import { createMemoryHistory } from '../src'

const locations: Record<
  string,
  {
    string: string
    normalized: RouteLocationNormalized
    toResolve?: MatcherLocation & Required<RouteQueryAndHash>
  }
> = {
  basic: {
    string: '/home',
    // toResolve: { path: '/home', fullPath: '/home', undefined, query: {}, hash: '' },
    normalized: {
      fullPath: '/home',
      path: '/home',
      params: {},
      meta: {},
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
      meta: {},
      query: { foo: 'a', bar: 'b' },
      hash: '',
      matched: [],
      name: undefined,
    },
  },
}

describe('RouterLink', () => {
  function factory(
    currentLocation: RouteLocationNormalized,
    propsData: any,
    resolvedLocation: RouteLocationNormalized
  ) {
    const router = {
      history: createMemoryHistory(),
      createHref(to: RouteLocationNormalized): string {
        return this.history.base + to.fullPath
      },
      resolve: jest.fn(),
      push: jest.fn(),
    }

    router.resolve.mockReturnValueOnce(resolvedLocation)
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
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('displays a link with an object with path prop', () => {
    const { wrapper } = factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('calls ensureLocation', () => {
    const { router } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(router.resolve).toHaveBeenCalledTimes(1)
    expect(router.resolve).toHaveBeenCalledWith(locations.basic.string)
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
      locations.withQuery.normalized // it doesn't matter as we want to check what resolve is called with
    )
    expect(router.resolve).toHaveBeenCalledWith(locations.withQuery.string)
  })
})
