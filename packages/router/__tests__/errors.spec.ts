import fakePromise from 'faked-promise'
import { createRouter as newRouter, createMemoryHistory } from '../src'
import {
  NavigationFailure,
  NavigationFailureType,
  isNavigationFailure,
  createRouterError,
  ErrorTypes,
} from '../src/errors'
import { components, tick } from './utils'
import {
  RouteRecordRaw,
  NavigationGuard,
  RouteLocationRaw,
  START_LOCATION_NORMALIZED,
  RouteLocationNormalized,
} from '../src/types'
import { mockWarn } from 'jest-mock-warn'

const routes: Readonly<RouteRecordRaw>[] = [
  { path: '/', component: components.Home },
  { path: '/redirect', redirect: '/' },
  { path: '/foo', component: components.Foo, name: 'Foo' },
  // prevent the log of no match warnings
  { path: '/:pathMatch(.*)', component: components.Home },
  { path: '/async', component: () => Promise.reject('failed') },
]

const onError = jest.fn()
const afterEach = jest.fn()
function createRouter() {
  const history = createMemoryHistory()
  const router = newRouter({
    history,
    routes,
  })

  router.onError(onError)
  router.afterEach(afterEach)
  return { router, history }
}

describe('Errors & Navigation failures', () => {
  mockWarn()
  beforeEach(() => {
    onError.mockReset()
    afterEach.mockReset()
  })

  it('next(false) triggers afterEach', async () => {
    await testNavigation(
      false,
      expect.objectContaining({
        type: NavigationFailureType.aborted,
      })
    )
  })

  it('lazy loading reject', async () => {
    await testError(true, 'failed', '/async')
  })

  it('Duplicated navigation triggers afterEach', async () => {
    let expectedFailure = expect.objectContaining({
      type: NavigationFailureType.duplicated,
      to: expect.objectContaining({ path: '/' }),
      from: expect.objectContaining({ path: '/' }),
    })

    const { router } = createRouter()

    await expect(router.push('/')).resolves.toEqual(undefined)
    expect(afterEach).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(0)

    await expect(router.push('/')).resolves.toEqual(expectedFailure)
    expect(afterEach).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(0)

    expect(afterEach).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expectedFailure
    )
  })

  it('next("/location") triggers afterEach', async () => {
    await testNavigation(
      ((to, from, next) => {
        if (to.path === '/location') next()
        else next('/location')
      }) as NavigationGuard,
      undefined
    )
  })

  it('redirect triggers afterEach', async () => {
    await testNavigation(undefined, undefined, '/redirect')
  })

  it('next() triggers afterEach', async () => {
    await testNavigation(undefined, undefined)
  })

  it('next(true) triggers afterEach', async () => {
    await testNavigation(true, undefined)
  })

  it('triggers afterEach if a new navigation happens', async () => {
    const { router } = createRouter()
    const [promise, resolve] = fakePromise()
    router.beforeEach((to, from, next) => {
      // let it hang otherwise
      if (to.path === '/') next()
      else promise.then(() => next())
    })

    let from = router.currentRoute.value

    // should hang
    let navigationPromise = router.push('/foo')

    expect(afterEach).toHaveBeenCalledTimes(0)
    await expect(router.push('/')).resolves.toEqual(undefined)
    expect(onError).toHaveBeenCalledTimes(0)

    resolve()
    await navigationPromise
    expect(afterEach).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(0)

    expect(afterEach).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: '/foo' }),
      from,
      expect.objectContaining({ type: NavigationFailureType.cancelled })
    )
  })

  it('next(new Error()) triggers onError', async () => {
    let error = new Error()
    await testError(error, error)
  })

  it('triggers onError with thrown errors', async () => {
    let error = new Error()
    await testError(() => {
      throw error
    }, error)
  })

  it('triggers onError with to and from', async () => {
    const { router } = createRouter()
    let expectedTo: RouteLocationNormalized | undefined
    let expectedFrom: RouteLocationNormalized | undefined
    const error = new Error()
    router.beforeEach((to, from) => {
      expectedTo = to
      expectedFrom = from
      throw error
    })

    await router.push('/foo').catch(() => {})

    expect(afterEach).toHaveBeenCalledTimes(0)
    expect(onError).toHaveBeenCalledTimes(1)

    expect(onError).toHaveBeenCalledWith(error, expectedTo, expectedFrom)
  })

  it('triggers onError with rejected promises', async () => {
    let error = new Error()
    await testError(async () => {
      throw error
    }, error)
  })

  describe('history navigation', () => {
    it('triggers afterEach with history.back', async () => {
      const { router, history } = createRouter()

      await router.push('/')
      await router.push('/foo')

      afterEach.mockReset()
      onError.mockReset()

      const [promise, resolve] = fakePromise()
      router.beforeEach((to, from, next) => {
        // let it hang otherwise
        if (to.path === '/') next()
        else promise.then(() => next())
      })

      let from = router.currentRoute.value

      // should hang
      let navigationPromise = router.push('/bar')

      // goes from /foo to /
      expect(afterEach).toHaveBeenCalledTimes(0)
      history.go(-1)

      await tick()

      expect(onError).toHaveBeenCalledTimes(0)
      resolve()
      await expect(navigationPromise).resolves.toEqual(
        expect.objectContaining({ type: NavigationFailureType.cancelled })
      )

      expect(afterEach).toHaveBeenCalledTimes(2)
      expect(onError).toHaveBeenCalledTimes(0)

      expect(afterEach).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ path: '/bar' }),
        from,
        expect.objectContaining({ type: NavigationFailureType.cancelled })
      )

      expect(afterEach).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ path: '/' }),
        from,
        undefined
      )
    })

    it('next(false) triggers afterEach with history.back', async () => {
      await testHistoryNavigation(
        false,
        expect.objectContaining({ type: NavigationFailureType.aborted })
      )
    })

    it('next("/location") triggers afterEach with history.back', async () => {
      await testHistoryNavigation(
        ((to, from, next) => {
          if (to.path === '/location') next()
          else next('/location')
        }) as NavigationGuard,
        undefined
      )
    })

    it('next() triggers afterEach with history.back', async () => {
      await testHistoryNavigation(undefined, undefined)
    })

    it('next(true) triggers afterEach with history.back', async () => {
      await testHistoryNavigation(true, undefined)
    })

    it('next(new Error()) triggers onError with history.back', async () => {
      let error = new Error()
      await testHistoryError(error, error)
    })

    it('triggers onError with thrown errors with history.back', async () => {
      let error = new Error()
      await testHistoryError(() => {
        throw error
      }, error)
    })

    it('triggers onError with rejected promises with history.back', async () => {
      let error = new Error()
      await testHistoryError(async () => {
        throw error
      }, error)
    })
  })
})

describe('isNavigationFailure', () => {
  const from = START_LOCATION_NORMALIZED
  const to = from
  it('non objects', () => {
    expect(isNavigationFailure(null)).toBe(false)
    expect(isNavigationFailure(true)).toBe(false)
    expect(isNavigationFailure(false)).toBe(false)
  })

  it('errors', () => {
    expect(isNavigationFailure(new Error())).toBe(false)
  })

  it('any navigation failure', () => {
    expect(
      isNavigationFailure(
        createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_ABORTED, {
          from,
          to,
        })
      )
    ).toBe(true)
  })

  it('specific navigation failure', () => {
    expect(
      isNavigationFailure(
        createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_ABORTED, {
          from,
          to,
        }),
        NavigationFailureType.aborted
      )
    ).toBe(true)
  })

  it('multiple navigation failure types', () => {
    expect(
      isNavigationFailure(
        createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_ABORTED, {
          from,
          to,
        }),
        NavigationFailureType.aborted | NavigationFailureType.cancelled
      )
    ).toBe(true)
    expect(
      isNavigationFailure(
        createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_CANCELLED, {
          from,
          to,
        }),
        NavigationFailureType.aborted | NavigationFailureType.cancelled
      )
    ).toBe(true)
    expect(
      isNavigationFailure(
        createRouterError<NavigationFailure>(ErrorTypes.NAVIGATION_DUPLICATED, {
          from,
          to,
        }),
        NavigationFailureType.aborted | NavigationFailureType.cancelled
      )
    ).toBe(false)
  })
})

async function testError(
  nextArgument: any | NavigationGuard,
  expectedError: any = undefined,
  to: RouteLocationRaw = '/foo'
) {
  const { router } = createRouter()
  router.beforeEach(
    typeof nextArgument === 'function'
      ? nextArgument
      : (to, from, next) => {
          next(nextArgument)
        }
  )

  if (expectedError !== undefined) {
    await expect(router.push(to)).rejects.toEqual(expectedError)
  } else {
    await router.push(to).catch(() => {})
  }

  expect(afterEach).toHaveBeenCalledTimes(0)
  expect(onError).toHaveBeenCalledTimes(1)

  expect(onError).toHaveBeenCalledWith(
    expectedError,
    expect.any(Object),
    expect.any(Object)
  )
}

async function testNavigation(
  nextArgument: any | NavigationGuard,
  expectedFailure: NavigationFailure | void = undefined,
  to: RouteLocationRaw = '/foo'
) {
  const { router } = createRouter()
  router.beforeEach(
    typeof nextArgument === 'function'
      ? nextArgument
      : (to, from, next) => {
          next(nextArgument)
        }
  )

  await expect(router.push(to)).resolves.toEqual(expectedFailure)

  expect(afterEach).toHaveBeenCalledTimes(1)
  expect(onError).toHaveBeenCalledTimes(0)

  expect(afterEach).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    expectedFailure
  )
}

async function testHistoryNavigation(
  nextArgument: any | NavigationGuard,
  expectedFailure: NavigationFailure | void = undefined,
  to: RouteLocationRaw = '/foo'
) {
  const { router, history } = createRouter()
  await router.push(to)

  router.beforeEach(
    typeof nextArgument === 'function'
      ? nextArgument
      : (to, from, next) => {
          next(nextArgument)
        }
  )

  afterEach.mockReset()
  onError.mockReset()

  history.go(-1)

  await tick()

  expect(afterEach).toHaveBeenCalledTimes(1)
  expect(onError).toHaveBeenCalledTimes(0)

  expect(afterEach).toHaveBeenCalledWith(
    expect.any(Object),
    expect.any(Object),
    expectedFailure
  )
}

async function testHistoryError(
  nextArgument: any | NavigationGuard,
  expectedError: Error | void = undefined,
  to: RouteLocationRaw = '/foo'
) {
  const { router, history } = createRouter()
  await router.push(to)

  router.beforeEach(
    typeof nextArgument === 'function'
      ? nextArgument
      : (to, from, next) => {
          next(nextArgument)
        }
  )

  afterEach.mockReset()
  onError.mockReset()

  history.go(-1)

  await tick()

  expect(afterEach).toHaveBeenCalledTimes(0)
  expect(onError).toHaveBeenCalledTimes(1)

  expect(onError).toHaveBeenCalledWith(
    expectedError,
    expect.any(Object),
    expect.any(Object)
  )
}
