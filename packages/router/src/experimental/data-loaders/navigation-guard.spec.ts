/**
 * @vitest-environment happy-dom
 */
import { App, createApp, defineComponent } from 'vue'
import {
  DefineDataLoaderOptions_LaxData,
  DefineDataLoaderOptions_DefinedData,
  defineBasicLoader,
} from './defineLoader'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createRouter } from '../../router'
import { createMemoryHistory } from '../../history/memory'
import {
  ABORT_CONTROLLER_KEY,
  LOADER_SET_KEY,
  setCurrentContext,
  DataLoaderPlugin,
  NavigationResult,
  DataLoaderPluginOptions,
  useIsDataLoading,
} from './entries/index'
import { mockPromise } from '../../tests/utils'
import { useDataOne, useDataTwo } from '../../tests/data-loaders/loaders'
import { type NavigationFailure } from '../../errors'
import { Router } from '../../router'

function mockedLoader<T = string | NavigationResult>(
  // boolean is easier to handle for router mock
  options:
    | DefineDataLoaderOptions_LaxData
    | DefineDataLoaderOptions_DefinedData = {}
) {
  const [spy, resolve, reject] = mockPromise<T, unknown>(
    // not correct as T could be something else
    'ok' as T,
    new Error('ko')
  )
  return {
    spy,
    resolve,
    reject,
    loader: defineBasicLoader(async () => await spy(), options),
  }
}

let router: Router | null = null
let pendingNavigation: ReturnType<Router['push']> | null = null

function getRouter(): Router {
  if (!router) {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          component: defineComponent({ template: '<div>home</div>' }),
        },
      ],
    })
    const originalPush = router.push.bind(router)
    const originalReplace = router.replace.bind(router)
    router.push = (...args) => (pendingNavigation = originalPush(...args))
    router.replace = (...args) => (pendingNavigation = originalReplace(...args))
  }
  return router
}

function getPendingNavigation() {
  return pendingNavigation
}

describe('navigation-guard', () => {
  let globalApp: App | undefined

  beforeEach(() => {
    router = null
    pendingNavigation = null
  })

  function setupApp(options: Omit<DataLoaderPluginOptions, 'router'>) {
    const app = createApp({ render: () => null })
    const r = getRouter()
    app.use(DataLoaderPlugin, {
      router: r,
      ...options,
    })
    app.use(r)
    // invalidate current context
    setCurrentContext(undefined)
    globalApp = app
    return { app }
  }

  afterEach(() => {
    if (globalApp) {
      globalApp.mount('body')
      globalApp.unmount()
      globalApp = undefined
    }
  })

  // enableAutoUnmount(afterEach)

  // we use fake timers to ensure debugging tests do not rely on timers
  const now = new Date(2000, 0, 1).getTime() // 1 Jan 2000 in local time as number of milliseconds
  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  const component = defineComponent({})
  const loader1 = defineBasicLoader(async () => {})
  const loader2 = defineBasicLoader(async () => {})
  const loader3 = defineBasicLoader(async () => {})

  it('creates a set of loaders during navigation', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
    })
    await router.push('/fetch')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect(set).toBeDefined()
    expect(set).toHaveLength(0)
  })

  it('collects loaders from the matched route', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [loader1, loader1], // duplicated on purpose
      },
    })
    router.addRoute({
      name: '_test2',
      path: '/fetch2',
      component,
      meta: {
        loaders: [loader2, loader3],
      },
    })
    await router.push('/fetch')
    let set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader1])
    await router.push('/fetch2')
    set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader2, loader3])
  })

  it('collect loaders from nested routes', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [loader1],
      },
      children: [
        {
          name: '_test2',
          path: 'nested',
          component,
          meta: {
            loaders: [loader2, loader3],
          },
        },
      ],
    })
    await router.push('/fetch/nested')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([loader1, loader2, loader3])
  })

  it('collects all loaders from lazy loaded pages', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: () =>
        import('../../tests/data-loaders/ComponentWithLoader.vue'),
    })
    await router.push('/fetch')
    const set = router.currentRoute.value.meta[LOADER_SET_KEY]
    expect([...set!]).toEqual([useDataOne, useDataTwo])
  })

  it('awaits for all loaders to be resolved', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    const l1 = mockedLoader()
    const l2 = mockedLoader()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    l1.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('does not await for lazy loaders on client-side navigation', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    const l2 = mockedLoader({ lazy: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).toBe('/fetch')
    l1.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('awaits for lazy loaders on server-side navigation', async () => {
    setupApp({ isSSR: true })
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    const l2 = mockedLoader({ lazy: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l2.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(router.currentRoute.value.path).not.toBe('/fetch')
    l1.resolve()
    await vi.advanceTimersByTimeAsync(0)
    await p
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('does not run loaders on server side if server: false', async () => {
    setupApp({ isSSR: true })
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true, server: false })
    const l2 = mockedLoader({ lazy: false, server: false })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    await router.push('/fetch')
    expect(router.currentRoute.value.path).toBe('/fetch')
    expect(l1.spy).not.toHaveBeenCalled()
    expect(l2.spy).not.toHaveBeenCalled()
  })

  it.each([true, false] as const)(
    'throws if a non lazy loader rejects, isSSR: %s',
    async isSSR => {
      setupApp({ isSSR })
      const router = getRouter()
      const l1 = mockedLoader({ lazy: false })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      const p = router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject()
      await expect(p).rejects.toThrow('ko')
      expect(router.currentRoute.value.path).not.toBe('/fetch')
    }
  )

  it('does not throw if a lazy loader rejects', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    l1.reject()
    await expect(p).resolves.toBeUndefined()
    expect(router.currentRoute.value.path).toBe('/fetch')
  })

  it('throws if a lazy loader rejects on server-side', async () => {
    setupApp({ isSSR: true })
    const router = getRouter()
    const l1 = mockedLoader({ lazy: true })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader],
      },
    })

    const p = router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    l1.reject()
    await expect(p).rejects.toThrow('ko')
    expect(router.currentRoute.value.path).not.toBe('/fetch')
  })

  it.todo(
    'does not call commit for a loader if the navigation is canceled by another loader'
  )

  it('sets isDataLoading within a navigation', async () => {
    const { app } = setupApp({ isSSR: false })
    const isGloballyLoading = app.runWithContext(() => useIsDataLoading())
    expect(isGloballyLoading.value).toBe(false)

    const router = getRouter()
    const l1 = mockedLoader()
    const l2 = mockedLoader()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader, l2.loader],
      },
    })

    router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    expect(isGloballyLoading.value).toBe(true)

    l1.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(isGloballyLoading.value).toBe(true)
    l2.resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(isGloballyLoading.value).toBe(false)
  })

  describe('signal', () => {
    it('aborts the signal if the navigation throws', async () => {
      setupApp({ isSSR: false })
      const router = getRouter()

      let signal!: AbortSignal
      router.beforeEach(to => {
        signal = (to.meta[ABORT_CONTROLLER_KEY] as AbortController)!.signal
      })
      router.beforeEach(() => {
        throw new Error('canceled')
      })

      await expect(router.push('/#other')).rejects.toThrow('canceled')

      expect(router.currentRoute.value.hash).not.toBe('#other')
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toBeInstanceOf(Error)
      expect(signal.reason!.message).toBe('canceled')
    })

    it('aborts the signal if the navigation is canceled', async () => {
      setupApp({ isSSR: false })
      const router = getRouter()

      let signal!: AbortSignal
      router.beforeEach(to => {
        signal = (to.meta[ABORT_CONTROLLER_KEY] as AbortController)!.signal
      })
      router.beforeEach(() => false)

      let reason: NavigationFailure | undefined | void
      router.afterEach((_to, _from, failure) => {
        reason = failure
      })

      await router.push('/#other')

      expect(router.currentRoute.value.hash).not.toBe('#other')
      expect(signal.aborted).toBe(true)
      expect(signal.reason).toBe(reason)
    })
  })

  it('redirects when a NavigationResult is thrown (via reroute)', async () => {
    setupApp({ isSSR: false })
    const router = getRouter()
    const l1 = mockedLoader()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component,
      meta: {
        loaders: [l1.loader],
      },
    })

    router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    l1.reject(new NavigationResult('/#ok'))
    await getPendingNavigation()?.catch(() => {})
    expect(router.currentRoute.value.fullPath).toBe('/#ok')
  })

  describe('errors', () => {
    class CustomError extends Error {}

    it('lets the navigation continue if the error is expected', async () => {
      setupApp({ isSSR: false })
      const router = getRouter()
      const l1 = mockedLoader({ errors: [CustomError] })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new CustomError('expected'))
      await getPendingNavigation()
      expect(router.currentRoute.value.fullPath).toBe('/fetch')
    })

    it('fails the navigation if the error is not expected', async () => {
      setupApp({ isSSR: false })
      const router = getRouter()
      const l1 = mockedLoader({ errors: [CustomError] })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new Error('unexpected'))
      await expect(getPendingNavigation()).rejects.toThrow('unexpected')
      expect(router.currentRoute.value.fullPath).not.toBe('/fetch')
    })

    it('works with a function check', async () => {
      setupApp({ isSSR: false })
      const router = getRouter()
      const l1 = mockedLoader({
        errors: e => e instanceof Error && e.message === 'expected',
      })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new Error('expected'))
      await getPendingNavigation()
      expect(router.currentRoute.value.fullPath).toBe('/fetch')

      // use an unexpected error
      await router.push('/')
      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new Error('unexpected'))
      await getPendingNavigation()?.catch(() => {})
      expect(router.currentRoute.value.fullPath).not.toBe('/fetch')
    })

    it('local errors take precedence over global errors', async () => {
      setupApp({
        isSSR: false,
        // global only accepts CustomError
        errors: e => e instanceof CustomError,
      })
      const router = getRouter()
      const l1 = mockedLoader({
        // but local accepts Error with message 'expected'
        errors: e => e instanceof Error && e.message === 'expected',
      })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })

      // not covered by any
      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new Error('unexpected'))
      await getPendingNavigation()?.catch(() => {})
      expect(router.currentRoute.value.fullPath).not.toBe('/fetch')

      // covered locally only
      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new Error('expected'))
      await getPendingNavigation()?.catch(() => {})
      expect(router.currentRoute.value.fullPath).toBe('/fetch')
    })

    it('local errors completely override global ones', async () => {
      setupApp({
        isSSR: false,
        // global only accepts CustomError
        errors: [CustomError],
      })
      const router = getRouter()
      const l1 = mockedLoader({
        // but local accepts Error with message 'expected'
        errors: e => e instanceof Error && e.message === 'expected',
      })
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component,
        meta: {
          loaders: [l1.loader],
        },
      })
      //
      // covered locally only
      router.push('/fetch')
      await vi.advanceTimersByTimeAsync(0)
      l1.reject(new CustomError())
      await getPendingNavigation()?.catch(() => {})
      // the navigation was not aborted
      expect(router.currentRoute.value.fullPath).toBe('/')
    })
  })
})
