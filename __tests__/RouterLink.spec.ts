/**
 * @jest-environment jsdom
 */
import RouterLink from '../src/components/Link'
import {
  START_LOCATION_NORMALIZED,
  RouteQueryAndHash,
  MatcherLocation,
  RouteLocationNormalized,
} from '../src/types'
import { createMemoryHistory } from '../src'
import { mount } from './mount'
import { ref, markNonReactive } from 'vue'
import { tick } from './utils'

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
      push: jest.fn().mockResolvedValue(resolvedLocation),
      currentRoute: ref(markNonReactive(currentLocation)),
      setActiveApp: jest.fn(),
    }

    router.resolve.mockReturnValueOnce(resolvedLocation)
    const { app, el } = mount(router as any, {
      template: `<RouterLink :to="to">a link</RouterLink>`,
      components: { RouterLink },
      setup() {
        const to = ref(propsData.to)

        return { to }
      },
    })

    return { app, router, el }
  }

  it('displays a link with a string prop', () => {
    const { el } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    expect(el.innerHTML).toBe('<a href="/home">a link</a>')
  })

  it('displays a link with an object with path prop', () => {
    const { el } = factory(
      START_LOCATION_NORMALIZED,
      { to: { path: locations.basic.string } },
      locations.basic.normalized
    )
    expect(el.innerHTML).toBe('<a href="/home">a link</a>')
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

  // TODO: call when we can test this
  it.skip('calls router.push when clicked', async () => {
    const { router, el } = factory(
      START_LOCATION_NORMALIZED,
      { to: locations.basic.string },
      locations.basic.normalized
    )
    el.click()
    await tick()
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith(locations.basic.normalized)
  })
})
