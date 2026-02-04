/**
 * @vitest-environment happy-dom
 */
import {
  type App,
  defineComponent,
  h,
  inject,
  nextTick,
  type Plugin,
  ref,
  toValue,
} from 'vue'
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
import { flushPromises, mount } from '@vue/test-utils'
import {
  setCurrentContext,
  DataLoaderPlugin,
  NavigationResult,
  type DataLoaderPluginOptions,
  type DataLoaderContextBase,
  type DefineDataLoaderOptionsBase_LaxData,
  type UseDataLoader,
} from '../../experimental/data-loaders/entries/index'
import { delay, mockPromise } from '../utils'
import RouterViewMock from '../data-loaders/RouterViewMock.vue'
import ComponentWithNestedLoader from '../data-loaders/ComponentWithNestedLoader.vue'
import { dataOneSpy, dataTwoSpy } from '../data-loaders/loaders'
// FIXME: The tester could be exposed in some way to let people implement their own data loaders
import { mockWarn } from '../vitest-mock-warn'
import { createRouter, type Router } from '../../router'
import { createMemoryHistory } from '../../history/memory'
import { type RouteLocationNormalizedLoaded } from '../../typed-routes'
import { isNavigationFailure, NavigationFailureType } from '../../errors'

let router: Router | null = null
let pendingNavigation: ReturnType<Router['push']> | null = null
export function getRouter(): Router {
  router ??= createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/',
        component: defineComponent({ template: '<div>home</div>' }),
      },
      {
        path: '/:pathMatch(.*)',
        component: defineComponent({ template: '<div>not found</div>' }),
      },
    ],
  })
  const originialPush = router.push.bind(router)
  const originalReplace = router.replace.bind(router)
  router.push = (...args) => {
    return (pendingNavigation = originialPush(...args))
  }
  router.replace = (...args) => {
    return (pendingNavigation = originalReplace(...args))
  }

  return router
}

export function getPendingNavigation(): typeof pendingNavigation {
  return pendingNavigation
}

export function testDefineLoader<Context = void>(
  loaderFactory: (
    context: {
      fn: (
        to: RouteLocationNormalizedLoaded,
        context: DataLoaderContextBase
      ) => Promise<unknown>
    } & DefineDataLoaderOptionsBase_LaxData & { key?: string }
  ) => UseDataLoader,
  {
    plugins,
    beforeEach: _beforeEach,
  }: {
    beforeEach?: () => Context
    plugins?: (
      context: Context
    ) => Array<Plugin | [plugin: Plugin, ...options: unknown[]]>
  } = {}
) {
  let customContext: Context | undefined

  function mockedLoader<T = string | NavigationResult>(
    // boolean is easier to handle for router mock
    options?: DefineDataLoaderOptionsBase_LaxData & { key?: string }
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
      loader: loaderFactory({ fn: spy, ...options }),
    }
  }

  mockWarn()

  // we use fake timers to ensure debugging tests do not rely on timers
  beforeAll(() => {
    vi.useFakeTimers()
    // must be > 0 to avoid unrealistic scenarios and false negatives
    vi.setSystemTime(100)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  beforeEach(async () => {
    dataOneSpy.mockClear()
    dataTwoSpy.mockClear()
    if (_beforeEach) {
      customContext = await _beforeEach()
    }
  })

  afterEach(() => {
    router = null
  })

  function singleLoaderOneRoute(
    useData: UseDataLoader,
    pluginOptions?: Omit<DataLoaderPluginOptions, 'router'>,
    opts: {
      router?: Router
      addToMetaLoaders?: boolean
      component?:
        | ReturnType<typeof defineComponent>
        | (() => Promise<ReturnType<typeof defineComponent>>)
    } = {}
  ) {
    let useDataResult: ReturnType<UseDataLoader>
    const component =
      opts.component ??
      defineComponent({
        setup() {
          useDataResult = useData()

          const { data, error, isLoading } = useDataResult
          return { data, error, isLoading }
        },
        template: `\
<div>
  <p id="route">{{ $route.path }}</p>
  <p id="data">{{ data }}</p>
  <p id="error">{{ error }}</p>
  <p id="isLoading">{{ isLoading }}</p>
</div>`,
      })
    const router = opts.router ?? getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      meta: {
        loaders: opts.addToMetaLoaders === false ? [] : [useData],
        nested: { foo: 'bar' },
      },
      component,
    })

    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router, ...pluginOptions }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })

    const app: App = wrapper.vm.$.appContext.app

    return {
      wrapper,
      router,
      useData: () => {
        if (useDataResult) {
          return useDataResult
        }
        // forced to ensure similar running context to within a component
        // this is for tests that call useData() before the navigation is finished
        setCurrentContext(undefined)
        return app.runWithContext(() => useData()) as ReturnType<UseDataLoader>
      },
      app,
    }
  }

  const COMMIT_MODES: ['immediate', 'after-load'] = ['immediate', 'after-load']
  const LAZY_MODES: [true, false, () => true, () => false] = [
    true,
    false,
    (): true => true,
    (): false => false,
  ]
  // for debugging specific modes more easily
  // COMMIT_MODES.splice(0, COMMIT_MODES.length, 'after-load')
  // LAZY_MODES.splice(0, LAZY_MODES.length, false)

  describe.each(COMMIT_MODES)('commit: %s', commit => {
    describe.each(LAZY_MODES)('lazy: %s', lazy => {
      it(`can resolve a "null" value after an error`, async () => {
        const spy = vi
          .fn<(...args: unknown[]) => Promise<unknown>>()
          .mockResolvedValueOnce(null)
        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        await router.push('/fetch')
        expect(spy).toHaveBeenCalledTimes(1)
        const { data } = useData()
        expect(data.value).toEqual(null)
      })

      it('can reject outside of a navigation', async () => {
        const spy = vi
          .fn<(...args: unknown[]) => Promise<unknown>>()
          .mockResolvedValue('ko')

        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        // initial navigation
        await router.push('/fetch')
        const { error, reload } = useData()
        spy.mockRejectedValueOnce(new Error('ok'))
        await reload().catch(() => {})
        await vi.advanceTimersByTimeAsync(0)
        expect(spy).toHaveBeenCalledTimes(2)
        expect(error.value).toEqual(new Error('ok'))
      })

      it(`can return a NavigationResult without affecting initial data, commit: ${commit} lazy: ${lazy}`, async () => {
        let calls = 0
        const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
          return calls++ === 0 ? new NavigationResult('/other') : to.query.p
        })
        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        await router.push('/fetch?p=ko')
        expect(spy).toHaveBeenCalled()
        const { data } = useData()
        expect(data.value).toEqual(undefined)
      })

      it('can return a NavigationResult without affecting loaded data', async () => {
        let calls = 0
        const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
          return calls++ > 0 ? new NavigationResult('/other') : to.query.p
        })
        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        await router.push('/fetch?p=ok')
        const { data } = useData()
        expect(spy).toHaveBeenCalled()
        expect(data.value).toEqual('ok')
        await router.push('/fetch?p=ko')
        expect(data.value).toEqual('ok')
      })

      // in lazy false, commit after-load, the error prevents the navigation
      // so the error doesn't even get a chance to be used if we navigate. This is why we do a first regular navigation and then a reload: to force the fetch again
      it('can return a NavigationResult without affecting the last error', async () => {
        const spy = vi.fn().mockResolvedValueOnce('ko')
        const { useData, router } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        await router.push('/fetch?p=ok').catch(() => {})
        const { error, reload } = useData()
        spy.mockRejectedValueOnce(new Error('ok'))
        await reload().catch(() => {})
        expect(spy).toHaveBeenCalled()
        expect(error.value).toEqual(new Error('ok'))
        spy.mockResolvedValueOnce(new NavigationResult('/other'))
        await router.push('/fetch?p=ko').catch(() => {})
        expect(error.value).toEqual(new Error('ok'))
      })

      it(`the resolved data is present after navigation`, async () => {
        const spy = vi
          .fn<(...args: unknown[]) => Promise<string>>()
          .mockResolvedValueOnce('resolved')
        const { wrapper, useData, router } = singleLoaderOneRoute(
          // loaders are not require to allow sync return values
          loaderFactory({ lazy, commit, fn: spy })
        )
        expect(spy).not.toHaveBeenCalled()
        await router.push('/fetch')
        expect(wrapper.get('#error').text()).toBe('')
        expect(wrapper.get('#isLoading').text()).toBe('false')
        expect(wrapper.get('#data').text()).toBe('resolved')
        expect(spy).toHaveBeenCalledTimes(1)
        const { data } = useData()
        expect(data.value).toEqual('resolved')
      })

      it(`can be forced reloaded`, async () => {
        const spy = vi
          .fn<(...args: unknown[]) => Promise<string>>()
          .mockResolvedValueOnce('resolved 1')
        const { router, useData } = singleLoaderOneRoute(
          loaderFactory({ lazy, commit, fn: spy })
        )
        await router.push('/fetch')
        expect(spy).toHaveBeenCalledTimes(1)
        const { data, reload } = useData()
        expect(data.value).toEqual('resolved 1')
        spy.mockResolvedValueOnce('resolved 2')
        await reload()
        expect(data.value).toEqual('resolved 2')
        expect(spy).toHaveBeenCalledTimes(2)
        spy.mockResolvedValueOnce('resolved 3')
        await reload()
        expect(spy).toHaveBeenCalledTimes(3)
        expect(data.value).toEqual('resolved 3')
      })

      it(`always reloads if the previous result is an error commit: ${commit}, lazy: ${lazy}`, async () => {
        let calls = 0
        const l = mockedLoader({ lazy, commit })
        l.spy.mockImplementation(async () => {
          // we delay lazy loaders because they don't block the navigation so
          // we want to let them finish after navigation so the loader
          // implementation reuses the ongoing fetch
          if (toValue(lazy)) {
            await delay(10)
          }
          if (calls++ === 0) {
            throw new Error('nope')
          } else {
            return 'ok'
          }
        })
        const { useData, router } = singleLoaderOneRoute(l.loader)
        expect(l.spy).toHaveBeenCalledTimes(0)

        let navigationPromise: Promise<unknown> = router.push('/fetch')

        // only the non lazy loader propagates the error to the navigation
        if (toValue(lazy)) {
          await expect(navigationPromise).resolves.toBeUndefined()
          await vi.advanceTimersByTimeAsync(10)
        } else {
          // await vi.advanceTimersByTimeAsync(10)
          await expect(navigationPromise).rejects.toThrow('nope')
        }

        await nextTick()
        expect(l.spy).toHaveBeenCalledTimes(1)

        // for lazy loaders we need to navigate to trigger the loader
        // so we add a hash to enforce that
        navigationPromise = router.push('/fetch#one')
        await vi.advanceTimersByTimeAsync(10)
        await expect(navigationPromise).resolves.toBeUndefined()
        // await vi.advanceTimersByTimeAsync(0)
        expect(l.spy).toHaveBeenCalledTimes(2)
        const { data, error } = useData()
        expect(error.value).toBe(null)
        expect(data.value).toBe('ok')
      })

      it('keeps the existing error until the new data is resolved', async () => {
        const l = mockedLoader({ lazy, commit })
        const { useData, router } = singleLoaderOneRoute(l.loader)
        l.spy.mockResolvedValueOnce('initial')
        // initiate the loader and then force an error
        await router.push('/fetch?p=ko')
        const { data, error, reload } = useData()
        // force the error
        l.spy.mockRejectedValueOnce(new Error('ok'))
        await reload().catch(() => {})
        await vi.advanceTimersByTimeAsync(0)
        expect(error.value).toEqual(new Error('ok'))

        // trigger a new navigation
        router.push('/fetch?p=ok')
        await vi.advanceTimersByTimeAsync(0)
        // we still see the error
        expect(error.value).toEqual(new Error('ok'))
        l.resolve('resolved')
        await vi.advanceTimersByTimeAsync(0)
        // not anymore
        expect(data.value).toBe('resolved')
      })

      it(`should not warn when throwing a known error, commit: ${commit} lazy: ${lazy}`, async () => {
        class CustomError extends Error {
          override name = 'CustomError'
        }
        const l = mockedLoader({ commit, lazy, errors: [CustomError] })
        l.spy.mockRejectedValueOnce(new CustomError('expected error'))
        const { useData, router } = singleLoaderOneRoute(l.loader)

        await router.push('/fetch')
        expect(router.currentRoute.value.path).toBe('/fetch')

        const { data, error } = useData()
        expect(error.value).toBeInstanceOf(CustomError)
        expect(data.value).toBe(undefined)

        expect('no staged data').not.toHaveBeenWarned()
      })
    })

    it(`should abort the navigation if a non lazy loader throws, commit: ${commit}`, async () => {
      const { router } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            throw new Error('nope')
          },
          lazy: false,
          commit,
        })
      )
      const onError = vi.fn()
      router.onError(onError)
      await expect(router.push('/fetch')).rejects.toThrow('nope')
      expect(onError).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.path).not.toBe('/fetch')
    })

    it(`should complete the navigation if a lazy loader throws, commit: ${commit}`, async () => {
      const { useData, router } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            throw new Error('nope')
          },
          lazy: true,
          commit,
        })
      )
      await expect(router.push('/fetch')).resolves.toBeUndefined()
      expect(router.currentRoute.value.path).toBe('/fetch')
      const { data, isLoading, error } = useData()
      await flushPromises()
      expect(isLoading.value).toBe(false)
      expect(data.value).toBe(undefined)
      expect(error.value).toEqual(new Error('nope'))
    })

    describe('custom errors', () => {
      class CustomError extends Error {
        override name = 'CustomError'
      }
      it(`should complete the navigation if a non-lazy loader throws an expected error, commit: ${commit}`, async () => {
        const { wrapper, useData, router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new CustomError()
            },
            lazy: false,
            commit,
            errors: [CustomError],
          })
        )
        await router.push('/fetch')
        expect(router.currentRoute.value.path).toBe('/fetch')
        const { data, error, isLoading } = useData()
        expect(wrapper.get('#error').text()).toBe('CustomError')
        expect(isLoading.value).toBe(false)
        expect(data.value).toBe(undefined)
        expect(error.value).toBeInstanceOf(CustomError)
      })

      it(`should complete the navigation if a non-lazy loader throws an expected global error, commit: ${commit}`, async () => {
        const { wrapper, useData, router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new CustomError()
            },
            lazy: false,
            commit,
            errors: true,
          }),
          { errors: [CustomError] }
        )
        await router.push('/fetch')
        const { data, error, isLoading } = useData()
        expect(wrapper.get('#error').text()).toBe('CustomError')
        expect(isLoading.value).toBe(false)
        expect(data.value).toBe(undefined)
        expect(error.value).toBeInstanceOf(CustomError)
        expect(router.currentRoute.value.path).toBe('/fetch')
      })

      it(`accepts a function as a global setting instead of a constructor, commit: ${commit}`, async () => {
        const { wrapper, useData, router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new CustomError()
            },
            lazy: false,
            commit,
            errors: true,
          }),
          { errors: reason => reason instanceof CustomError }
        )
        await router.push('/fetch')
        const { data, error, isLoading } = useData()
        expect(wrapper.get('#error').text()).toBe('CustomError')
        expect(isLoading.value).toBe(false)
        expect(data.value).toBe(undefined)
        expect(error.value).toBeInstanceOf(CustomError)
        expect(router.currentRoute.value.path).toBe('/fetch')
      })

      it(`local errors take priority over a global function that returns false, commit: ${commit}`, async () => {
        const { wrapper, useData, router } = singleLoaderOneRoute(
          loaderFactory({
            fn: async () => {
              throw new CustomError()
            },
            lazy: false,
            commit,
            errors: [CustomError],
          }),
          { errors: () => false }
        )
        await router.push('/fetch')
        const { data, error, isLoading } = useData()
        expect(wrapper.get('#error').text()).toBe('CustomError')
        expect(isLoading.value).toBe(false)
        expect(data.value).toBe(undefined)
        expect(error.value).toBeInstanceOf(CustomError)
        expect(router.currentRoute.value.path).toBe('/fetch')
      })
    })

    it(`propagates errors from nested loaders, commit: ${commit}`, async () => {
      const l1 = mockedLoader({
        key: 'nested',
        commit,
        lazy: false,
      })
      const { router } = singleLoaderOneRoute(
        loaderFactory({
          fn: async to => {
            await l1.loader()
            // never reached
            return `ko,${to.query.p}`
          },
          key: 'root',
        })
      )

      const p = router.push('/fetch?p=one')
      // Let the loaders start
      await vi.advanceTimersByTimeAsync(0)

      l1.reject(new Error('nope'))
      await expect(p).rejects.toThrow('nope')
    })

    // https://github.com/posva/unplugin-vue-router/issues/763
    for (const reason of [undefined, new Error('custom abort reason')]) {
      it(`propagates abortions with ${reason ? 'Error' : 'undefined'} from nested loaders, commit: ${commit}`, async () => {
        const alwaysAbortsLoader = mockedLoader({
          key: 'nested',
          commit,
          lazy: false,
        })
        alwaysAbortsLoader.spy.mockImplementation(async () => {
          const controller = new AbortController()
          controller.abort(reason)
          controller.signal.throwIfAborted()
          return 'ko'
        })

        const rootLoader = mockedLoader({
          key: 'root',
        })
        rootLoader.spy.mockImplementation(async () => {
          await alwaysAbortsLoader.loader()
          // never gets here
          return 'ko'
        })

        const router = getRouter()
        router.addRoute({
          name: '_test',
          path: '/fetch',
          component: defineComponent({
            setup() {
              const { data: nested } = alwaysAbortsLoader.loader()
              const { data: root } = rootLoader.loader()

              return { root, nested }
            },
            template: `<p>{{ root }}, {{ nested }}</p>`,
          }),
          meta: {
            loaders: [rootLoader.loader, alwaysAbortsLoader.loader],
            nested: { foo: 'bar' },
          },
        })
        mount(RouterViewMock, {
          global: {
            plugins: [
              [DataLoaderPlugin, { router }],
              ...(plugins?.(customContext!) || []),
              router,
            ],
          },
        })

        await expect(router.push('/fetch?p=one')).rejects.toThrowError(
          reason ?? 'signal is aborted without reason'
        )
        expect(router.currentRoute.value.fullPath).toBe('/')
        expect(rootLoader.spy).toHaveBeenCalledTimes(1)
        expect(alwaysAbortsLoader.spy).toHaveBeenCalledTimes(1)
      })
    }

    describe('thrown errors in a aborted loader', () => {
      it(`navigation does not reject if the loader throws the passed signal, commit: ${commit}`, async () => {
        const loader = mockedLoader({
          key: 'id',
          commit,
          lazy: false,
        })

        loader.spy.mockImplementation(
          async (
            _to: RouteLocationNormalizedLoaded,
            { signal }: { signal?: AbortSignal }
          ) => {
            await delay(10)
            signal?.throwIfAborted()
            return 'ko'
          }
        )

        const { router } = singleLoaderOneRoute(loader.loader)
        const onError = vi.fn()
        router.onError(onError)

        const navigationPromise = router.push('/fetch')
        // let the loaders start
        await vi.advanceTimersByTimeAsync(5)

        await expect(router.push('/?other')).resolves.toBeUndefined()
        await vi.advanceTimersByTimeAsync(5)

        const failure = await navigationPromise
        expect(failure).toBeDefined()
        expect(
          isNavigationFailure(failure, NavigationFailureType.aborted)
        ).toBe(true)
        expect(router.currentRoute.value.fullPath).toBe('/?other')
        // the error was not propagated
        expect(onError).not.toHaveBeenCalled()
      })

      it(`navigation rejects if the loader throws an error, commit: ${commit}`, async () => {
        const loader = mockedLoader({
          key: 'id',
          commit,
          lazy: false,
        })

        loader.spy.mockImplementation(async () => {
          await delay(10)
          throw new Error('ko')
        })

        const { router } = singleLoaderOneRoute(loader.loader)
        const onError = vi.fn()
        router.onError(onError)

        const navigationPromise = expect(router.push('/fetch')).rejects.toThrow(
          'ko'
        )
        // let the loaders start
        await vi.advanceTimersByTimeAsync(5)

        await expect(router.push('/?other')).resolves.toBeUndefined()
        await vi.advanceTimersByTimeAsync(5)

        await navigationPromise
        expect(router.currentRoute.value.fullPath).toBe('/?other')
        // the error was not propagated
        expect(onError).toHaveBeenCalledTimes(1)
      })
    })

    // https://github.com/posva/unplugin-vue-router/issues/584
    it(`skips child loaders if parent returns a NavigationResult, commit: ${commit}`, async () => {
      // Parent loader that redirects
      const parentLoader = mockedLoader({
        key: 'parent',
        commit,
        lazy: false,
      })
      parentLoader.spy.mockResolvedValue(new NavigationResult('/redirect'))

      const childLoader = mockedLoader({
        key: 'child',
        commit,
        lazy: false,
      })
      let calls = 0
      childLoader.spy.mockImplementation(async () => {
        const parentData = await parentLoader.loader()
        console.log('parent data in child loader:', parentData)
        calls++
        // never called
        return 'child'
      })

      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component: defineComponent({
          setup() {
            const { data: parent } = parentLoader.loader()
            const { data: child } = childLoader.loader()
            return { parent, child }
          },
          template: `<p>{{ parent }}, {{ child }}</p>`,
        }),
        meta: {
          loaders: [parentLoader.loader, childLoader.loader],
          nested: { foo: 'bar' },
        },
      })

      mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
            router,
          ],
        },
      })

      await router.push('/fetch?p=test')
      expect(router.currentRoute.value.path).toBe('/redirect')

      // we still call the loaders themselves because they are registered
      expect(parentLoader.spy).toHaveBeenCalledTimes(1)
      expect(childLoader.spy).toHaveBeenCalledTimes(1)
      expect(calls).toBe(0)
    })

    it(`can catch parent NavigationResult in child loaders, commit: ${commit}`, async () => {
      // Parent loader that redirects
      const parentLoader = mockedLoader({
        key: 'parent',
        commit,
        lazy: false,
      })
      parentLoader.spy.mockResolvedValue(new NavigationResult('/redirect'))

      const childLoader = mockedLoader({
        key: 'child',
        commit,
        lazy: false,
      })
      let calls = 0
      childLoader.spy.mockImplementation(async () => {
        await expect(parentLoader.loader()).rejects.toThrow(NavigationResult)
        calls++
        return 'child'
      })

      const grandchildLoader = mockedLoader({
        key: 'grandchild',
        commit,
        lazy: false,
      })
      grandchildLoader.spy.mockImplementation(async () => {
        // we caught it so the loader ran but the navigation is stil aborted
        await expect(childLoader.loader()).resolves.toBe('child')
        calls++
        return 'grandchild'
      })

      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component: defineComponent({
          setup() {
            const { data: parent } = parentLoader.loader()
            const { data: child } = childLoader.loader()
            const { data: grandchild } = grandchildLoader.loader()
            return { parent, child, grandchild }
          },
          template: `<p>{{ parent }}, {{ child }}, {{ grandchild }}</p>`,
        }),
        meta: {
          loaders: [
            parentLoader.loader,
            childLoader.loader,
            grandchildLoader.loader,
          ],
          nested: { foo: 'bar' },
        },
      })

      mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
            router,
          ],
        },
      })

      await router.push('/fetch?p=test')
      expect(router.currentRoute.value.path).toBe('/redirect')

      // we still call the loaders themselves because they are registered
      expect(parentLoader.spy).toHaveBeenCalledTimes(1)
      expect(childLoader.spy).toHaveBeenCalledTimes(1)
      expect(grandchildLoader.spy).toHaveBeenCalledTimes(1)

      // ensure the expects within the loaders ran
      expect(calls).toBe(2)
    })

    it(`works with canceled duplicated navigations, commit: ${commit}`, async () => {
      if (commit === 'immediate') {
        return
      }
      const router = getRouter()
      await router.push('/')

      let calls = 0
      const l = mockedLoader({ lazy: false, commit })
      l.spy.mockImplementation(async () => {
        // we want to delay this longer than the time we wait before triggering the 2nd navigation
        await new Promise(r => setTimeout(r, 50))
        // console.log('⏰💰 loader 50ms', Date.now())
        return `calls: ${++calls}`
      })
      const beforeEachSpy = vi.fn()
      router.beforeEach(beforeEachSpy)
      const afterEach = vi.fn()
      router.afterEach(afterEach)

      let useDataResult: ReturnType<typeof l.loader>
      const Comp = defineComponent({
        setup() {
          useDataResult = l.loader()

          const { data, error, isLoading } = useDataResult
          // this page component should not try to render without the loader having run
          expect(data.value).toBeDefined()
          return { data, error, isLoading }
        },
        template: `\
<div>
  <p id="route">{{ $route.path }}</p>
  <p id="data">{{ data }}</p>
  <p id="error">{{ error }}</p>
  <p id="isLoading">{{ isLoading }}</p>
</div>`,
      })
      const component = async () => {
        await new Promise(r => setTimeout(r, 10))
        // console.log('⏰ component 10ms', Date.now())
        return {
          default: Comp,
          useLoader: l.loader,
        }
      }
      singleLoaderOneRoute(
        l.loader,
        {},
        { component, router, addToMetaLoaders: false }
      )

      // double immediate navigation should cancel the first one
      const nav1 = router.push('/fetch')
      // advance enough to have two navigations but not let the async component load
      await vi.advanceTimersByTimeAsync(5)
      expect(beforeEachSpy).toHaveBeenCalledTimes(1)
      // console.log('waited 5', Date.now())
      const nav2 = router.push('/fetch')
      // let the new navigation start
      await vi.advanceTimersByTimeAsync(0)
      expect(beforeEachSpy).toHaveBeenCalledTimes(2)
      // expect(l.spy).toHaveBeenCalledTimes(0)

      // finish the async loading of the first navigation
      await vi.advanceTimersByTimeAsync(5)
      await nav1
      // console.log('nav 1 done', Date.now())
      // the navigation should not have let the route change
      expect(router.currentRoute.value.path).toBe('/')
      // expect(l.spy).toHaveBeenCalledTimes(1)

      // Let the loader finish
      // FIXME: should be 55. We are waiting the async loading twice
      // It's because we don't use record.mods
      await vi.advanceTimersByTimeAsync(65)
      await nav2
      expect(router.currentRoute.value.path).toBe('/fetch')
      // expect(wrapper.get('#data').text()).toContain('calls: ')
      expect(afterEach).toHaveBeenCalledTimes(2)
      expect(afterEach).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ path: '/fetch' }),
        expect.objectContaining({ path: '/' }),
        expect.objectContaining({ type: NavigationFailureType.cancelled })
      )
      expect(afterEach).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ path: '/fetch' }),
        expect.objectContaining({ path: '/' }),
        // no failure
        undefined
      )
    })
  })

  it('passes a signal to the loader', async () => {
    const spy =
      vi.fn<
        (
          to: RouteLocationNormalizedLoaded,
          context: DataLoaderContextBase
        ) => Promise<unknown>
      >()
    spy.mockResolvedValueOnce('ok')
    const { router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
    await router.push('/fetch?p=ok')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls.at(0)?.[1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('blocks navigation by default (non lazy)', async () => {
    const [spy, resolve] = mockPromise('resolved')
    const { useData, router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
    const p = router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalled()
    const { data } = useData()
    expect(data.value).toEqual(undefined)
    expect(router.currentRoute.value.fullPath).toEqual('/')
    resolve()
    await p
    expect(router.currentRoute.value.fullPath).toEqual('/fetch')
  })

  it('does not block navigation when lazy loaded', async () => {
    const [spy, resolve] = mockPromise('resolved')
    const { wrapper, useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: spy,
        lazy: true,
      })
    )
    expect(spy).not.toHaveBeenCalled()
    await router.push('/fetch')
    expect(router.currentRoute.value.fullPath).toEqual('/fetch')
    expect(spy).toHaveBeenCalled()
    expect(wrapper.get('#error').text()).toBe('')
    expect(wrapper.get('#isLoading').text()).toBe('true')
    expect(wrapper.get('#data').text()).toBe('')
    const { data } = useData()
    expect(data.value).toEqual(undefined)
    resolve()
    await vi.advanceTimersByTimeAsync(0)
    expect(data.value).toEqual('resolved')
    expect(wrapper.get('#isLoading').text()).toBe('false')
    expect(wrapper.get('#data').text()).toBe('resolved')
  })

  it('discards a pending load if a new navigation happens', async () => {
    let calls = 0
    let resolveFirstCall!: (val?: unknown) => void
    let resolveSecondCall!: (val?: unknown) => void
    const p1 = new Promise(r => (resolveFirstCall = r))
    const p2 = new Promise(r => (resolveSecondCall = r))
    const { useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: async to => {
          calls++
          if (calls === 1) {
            await p1
          } else if (calls === 2) {
            await p2
          }
          return to.query.p
        },
      })
    )
    const firstNavigation = router.push('/fetch?p=one')
    // if we don't wait a little bit, the first navigation won't have the time to trigger the loader once
    await vi.advanceTimersByTimeAsync(0)
    const secondNavigation = router.push('/fetch?p=two')
    await vi.advanceTimersByTimeAsync(0)
    resolveSecondCall()
    await secondNavigation
    const { data } = useData()
    expect(data.value).toEqual('two')
    resolveFirstCall('ko')
    await firstNavigation
    expect(data.value).toEqual('two')
    expect(calls).toEqual(2)
  })

  it('runs nested loaders from new navigations with the correct route', async () => {
    let nestedCalls = 0
    let resolveNestedFirstCall!: (val?: unknown) => void
    let resolveNestedSecondCall!: (val?: unknown) => void
    const nestedP1 = new Promise(r => (resolveNestedFirstCall = r))
    const nestedP2 = new Promise(r => (resolveNestedSecondCall = r))
    const nestedLoaderSpy = vi
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async to => {
        nestedCalls++
        if (nestedCalls === 1) {
          await nestedP1
        } else {
          await nestedP2
        }
        return to.query.p
      })
    const useNestedLoader = loaderFactory({
      fn: nestedLoaderSpy,
      key: 'nested',
    })

    let rootCalls = 0
    let resolveRootFirstCall!: (val?: unknown) => void
    let resolveRootSecondCall!: (val?: unknown) => void
    const rootP1 = new Promise(r => (resolveRootFirstCall = r))
    const rootP2 = new Promise(r => (resolveRootSecondCall = r))

    const rootLoaderSpy = vi
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async to => {
        rootCalls++
        const data = await useNestedLoader()
        if (rootCalls === 1) {
          await rootP1
        } else {
          await rootP2
        }
        return `${data},${to.query.p}`
      })

    const { useData, router, app } = singleLoaderOneRoute(
      loaderFactory({ fn: rootLoaderSpy, key: 'root' })
    )
    const firstNavigation = router.push('/fetch?p=one')
    // we resolve the first root to give the nested loader a chance to run
    resolveRootFirstCall()
    // allows root loader to run
    await vi.advanceTimersByTimeAsync(0)

    expect(rootLoaderSpy).toHaveBeenCalledTimes(1)
    // using toHaveBeenCalledWith yields an error that is difficult to debug
    // so this is for debugging purposes
    expect(rootLoaderSpy.mock.calls.at(0)?.at(0)?.fullPath).toBe('/fetch?p=one')

    expect(nestedLoaderSpy).toHaveBeenCalledTimes(1)
    expect(nestedLoaderSpy.mock.calls.at(-1)?.at(0)?.fullPath).toBe(
      '/fetch?p=one'
    )

    // now trigger the second navigation while the nested loader is pending
    const secondNavigation = router.push('/fetch?p=two')
    await vi.advanceTimersByTimeAsync(0)

    expect(rootLoaderSpy).toHaveBeenCalledTimes(2)
    expect(rootLoaderSpy.mock.calls.at(1)?.at(0)?.fullPath).toBe('/fetch?p=two')

    resolveRootSecondCall()
    await vi.advanceTimersByTimeAsync(0)

    expect(nestedLoaderSpy).toHaveBeenCalledTimes(2)
    expect(nestedLoaderSpy.mock.calls.at(-1)?.at(0)?.fullPath).toBe(
      '/fetch?p=two'
    )

    // the nested gets resolved for the first time
    resolveNestedFirstCall()
    resolveNestedSecondCall()
    await vi.advanceTimersByTimeAsync(0)

    // explicitly wait for both navigations to ensure everything ran
    await firstNavigation
    await secondNavigation

    expect(rootCalls).toEqual(2)
    expect(nestedCalls).toEqual(2)

    // only the data from the second navigation should be preserved
    const { data } = useData()
    const { data: nestedData } = app.runWithContext(() => useNestedLoader())

    expect(rootCalls).toEqual(2)
    expect(nestedCalls).toEqual(2)

    expect(nestedData.value).toEqual('two')
    expect(data.value).toEqual('two,two')
  })

  it('discards a pending load from a previous navigation that resolved later', async () => {
    let nestedCalls = 0
    let resolveNestedFirstCall!: (val?: unknown) => void
    let resolveNestedSecondCall!: (val?: unknown) => void
    const nestedP1 = new Promise(r => (resolveNestedFirstCall = r))
    const nestedP2 = new Promise(r => (resolveNestedSecondCall = r))
    const useNestedLoader = loaderFactory({
      fn: async to => {
        nestedCalls++
        if (nestedCalls === 1) {
          // expect(to.fullPath).toEqual('/fetch?two')
          await nestedP1
        } else {
          // since the first root resolve takes longer than the second nested resolve, the nested loader is called
          // TODO:
          // expect(to.fullPath).toEqual('/fetch?one')
          await nestedP2
        }
        return to.query.p
      },
      key: 'nested',
    })

    let rootCalls = 0
    let resolveRootFirstCall!: (val?: unknown) => void
    let resolveRootSecondCall!: (val?: unknown) => void
    const rootP1 = new Promise(r => (resolveRootFirstCall = r))
    const rootP2 = new Promise(r => (resolveRootSecondCall = r))

    const { useData, router, app } = singleLoaderOneRoute(
      loaderFactory({
        fn: async to => {
          rootCalls++
          const data = await useNestedLoader()
          if (rootCalls === 1) {
            await rootP1
          } else {
            await rootP2
          }
          return `${data},${to.query.p}`
        },
        key: 'root',
      })
    )
    const firstNavigation = router.push('/fetch?p=one')
    await vi.advanceTimersByTimeAsync(0)
    const secondNavigation = router.push('/fetch?p=two')
    await vi.advanceTimersByTimeAsync(0)
    resolveRootSecondCall()
    // the nested gets called for the first time
    resolveNestedFirstCall()

    await vi.advanceTimersByTimeAsync(0)
    resolveRootFirstCall()
    resolveNestedSecondCall()
    await vi.advanceTimersByTimeAsync(0)

    // explicitly wait for both navigations to ensure everything ran
    await firstNavigation
    await secondNavigation
    const { data } = useData()
    const { data: nestedData } = app.runWithContext(() => useNestedLoader())
    expect(data.value).toEqual('two,two')
    expect(nestedData.value).toEqual('two')

    expect(rootCalls).toEqual(2)
    // expect(nestedCalls).toEqual(2)
  })

  it('discards a pending load if trying to navigate back to the current location', async () => {
    let calls = 0
    let resolveCall1!: (val?: unknown) => void
    let resolveCall2!: (val?: unknown) => void
    let resolveCall3!: (val?: unknown) => void
    const p1 = new Promise(r => (resolveCall1 = r))
    const p2 = new Promise(r => (resolveCall2 = r))
    const p3 = new Promise(r => (resolveCall3 = r))
    const spy = vi
      .fn<(to: RouteLocationNormalizedLoaded) => Promise<unknown>>()
      .mockImplementation(async to => {
        calls++
        // the first one should be skipped
        if (calls === 2) {
          await p1
        } else if (calls === 3) {
          await p2
        } else if (calls === 4) {
          await p3
          // this should never happen or be used because the last navigation is considered duplicated
          return 'ko'
        }
        return to.query.p as string
      })
    const { useData, router } = singleLoaderOneRoute(loaderFactory({ fn: spy }))
    // set the initial location
    await router.push('/fetch?p=ok')

    const { data } = useData()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual('ok')

    // try running two navigations to a different location
    router.push('/fetch?p=ko')
    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(2)
    router.push('/fetch?p=ko')
    await vi.advanceTimersByTimeAsync(0)
    expect(spy).toHaveBeenCalledTimes(3)

    // but roll back to the initial one
    router.push('/fetch?p=ok')
    await vi.advanceTimersByTimeAsync(0)
    // it runs 3 times because in vue router, going from /fetch?p=ok to /fetch?p=ok fails right away, so the loader are never called
    // We simply don't test it because it doesn't matter, what matters is what value is preserved in the end
    // expect(spy).toHaveBeenCalledTimes(3)

    resolveCall1()
    resolveCall2()
    resolveCall3()
    await vi.advanceTimersByTimeAsync(0)
    await getPendingNavigation()

    // it preserves the initial value
    expect(data.value).toEqual('ok')
  })

  it('loader result can be awaited for the data to be ready', async () => {
    const [spy, resolve] = mockPromise('resolved')

    const { app, useData, router } = singleLoaderOneRoute(
      loaderFactory({ fn: async () => spy(), key: 'a' })
    )
    router.push('/fetch')
    // ensures the useData is called first
    await vi.advanceTimersByTimeAsync(0)
    const useDataPromise = app.runWithContext(() => useData())
    await vi.advanceTimersByTimeAsync(0)
    expect(useDataPromise).toBeInstanceOf(Promise)
    resolve()
    const data = await useDataPromise
    // await getPendingNavigation()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data).toEqual('resolved')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(data).toEqual('resolved')
  })

  it('can nest loaders', async () => {
    const spyOne = vi
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue('ko')
      .mockResolvedValueOnce('one')
    const spyTwo = vi
      .fn<(...args: unknown[]) => Promise<string>>()
      .mockResolvedValue('ko')
      .mockResolvedValueOnce('two')
    const useLoaderOne = loaderFactory({ fn: spyOne, key: 'one' })
    const useLoaderTwo = loaderFactory({
      fn: async () => {
        const one = await useLoaderOne()
        const two = await spyTwo()
        return `${one},${two}`
      },
      key: 'two',
    })
    const { useData, router } = singleLoaderOneRoute(useLoaderTwo)
    await router.push('/fetch')
    const { data } = useData()
    expect(spyOne).toHaveBeenCalledTimes(1)
    expect(spyTwo).toHaveBeenCalledTimes(1)
    expect(data.value).toEqual('one,two')
  })

  it('fetches once with lazy across components', async () => {
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: ComponentWithNestedLoader,
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })

    expect(dataOneSpy).toHaveBeenCalledTimes(0)
    await router.push('/fetch')
    // One tick to let the lazy loader start
    await vi.advanceTimersByTimeAsync(0)
    expect(dataOneSpy).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toMatchInlineSnapshot('"resolved 1resolved 1"')
  })

  it(`reuses loaders when they are both nested and used in navigation`, async () => {
    const l1 = mockedLoader({ key: 'nested' })
    const rootLoader = loaderFactory({
      fn: async to => {
        const d = await l1.loader()
        return `${d},${to.query.p}`
      },
      key: 'root',
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        setup() {
          const { data } = rootLoader()
          return { data }
        },
        template: `<p>{{ data }}</p>`,
      }),
      meta: {
        loaders: [rootLoader, l1.loader],
        nested: { foo: 'bar' },
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.advanceTimersByTimeAsync(0)
    l1.resolve('ok')
    await vi.advanceTimersByTimeAsync(0)
    // should have navigated and called the nested loader once
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/fetch?p=one')
    expect(wrapper.text()).toBe(`ok,one`)
  })

  it(`can use a nested loaded directly in the component`, async () => {
    const l1 = mockedLoader({ key: 'nested' })
    const rootLoader = loaderFactory({
      fn: async to => {
        const d = await l1.loader()
        return `${d},${to.query.p}`
      },
      key: 'root',
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        setup() {
          const { data } = l1.loader()
          const { data: root } = rootLoader()
          return { root, data }
        },
        template: `<p>{{ root }} {{ data }}</p>`,
      }),
      meta: {
        loaders: [rootLoader, l1.loader],
        nested: { foo: 'bar' },
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.advanceTimersByTimeAsync(0)
    l1.resolve('ok')
    await vi.advanceTimersByTimeAsync(0)
    // should have navigated and called the nested loader once
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.fullPath).toBe('/fetch?p=one')
    expect(wrapper.text()).toBe('ok,one ok')
  })

  it('keeps the old data until all loaders are resolved', async () => {
    const router = getRouter()
    const l1 = mockedLoader({ commit: 'after-load', key: 'l1' })
    const l2 = mockedLoader({ commit: 'after-load', key: 'l2' })
    router.addRoute({
      name: '_test',
      path: '/fetch',
      component: defineComponent({
        template: `<p></p>`,
      }),
      meta: {
        loaders: [l1.loader, l2.loader],
        nested: { foo: 'bar' },
      },
    })
    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })
    const app: App = wrapper.vm.$.appContext.app

    const p = router.push('/fetch')
    await vi.advanceTimersByTimeAsync(0)
    l1.resolve('one')
    await vi.advanceTimersByTimeAsync(0)

    const { data: one } = app.runWithContext(() => l1.loader())
    const { data: two } = app.runWithContext(() => l2.loader())

    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(l2.spy).toHaveBeenCalledTimes(1)

    // it waits for both to be resolved
    expect(one.value).toEqual(undefined)
    l2.resolve('two')
    await vi.advanceTimersByTimeAsync(0)
    await p
    expect(one.value).toEqual('one')
    expect(two.value).toEqual('two')
  })

  it.each([new NavigationResult(false), new Error('ko')] as const)(
    'does not commit new data if loader returns %s',
    async resolvedValue => {
      const l1 = mockedLoader({ lazy: false, commit: 'after-load', key: 'l1' })
      const l2 = mockedLoader({ lazy: false, commit: 'after-load', key: 'l2' })
      const router = getRouter()
      router.addRoute({
        name: '_test',
        path: '/fetch',
        component: defineComponent({
          template: `<p></p>`,
        }),
        meta: {
          loaders: [l1.loader, l2.loader],
          nested: { foo: 'bar' },
        },
      })

      const wrapper = mount(RouterViewMock, {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
            router,
          ],
        },
      })
      const app: App = wrapper.vm.$.appContext.app

      // we catch because in non-lazy loaders, throwing an error propagates it
      const p = router.push('/fetch').catch(() => {})
      await vi.advanceTimersByTimeAsync(0)
      l1.resolve('ko')
      await vi.advanceTimersByTimeAsync(0)
      expect(l1.spy).toHaveBeenCalledTimes(1)
      expect(l2.spy).toHaveBeenCalledTimes(1)
      if (resolvedValue instanceof NavigationResult) {
        l2.resolve(resolvedValue)
      } else {
        l2.reject(resolvedValue)
      }
      await vi.advanceTimersByTimeAsync(0)
      await p
      const { data: one, error: e1 } = app.runWithContext(() => l1.loader())
      const { data: two, error: e2 } = app.runWithContext(() => l2.loader())
      expect(one.value).toBe(undefined)
      expect(e1.value).toBe(null)
      expect(two.value).toBe(undefined)
      expect(e2.value).toBe(null)
    }
  )

  it('awaits for a lazy loader if used as a nested loader', async () => {
    const l1 = mockedLoader({ lazy: true, key: 'nested' })
    const { useData, router } = singleLoaderOneRoute(
      loaderFactory({
        fn: async to => {
          const data = await l1.loader()
          return `${data},${to.query.p}`
        },
        key: 'root',
      })
    )

    router.push('/fetch?p=one')
    await vi.advanceTimersByTimeAsync(0)

    const { data } = useData()
    expect(data.value).toEqual(undefined)

    l1.resolve('ok')
    await vi.advanceTimersByTimeAsync(0)
    expect(data.value).toEqual('ok,one')
  })

  it(`reuses a nested loader result even if it's called first from another loader`, async () => {
    const l1 = mockedLoader({ key: 'search-results', lazy: false })
    const spy = vi.fn(async (to: RouteLocationNormalizedLoaded) => {
      // get search results from the search loader
      const data = await l1.loader()
      // then fetch images in high res
      return `${data},${to.query.p}`
    })
    const l2 = loaderFactory({
      fn: spy,
      key: 'images-from-search',

      // to ensure this is not awaited
      lazy: true,
      server: false,
    })

    let useDataResult!: ReturnType<typeof l1.loader>

    const component = defineComponent({
      setup() {
        // it shouldn't matter if l2 is used or not, what matters is the order
        useDataResult = l1.loader()
        l2()
        return {}
      },
      template: `<p>a</p>`,
    })
    const router = getRouter()
    router.addRoute({
      name: '_test',
      path: '/fetch',
      meta: {
        // the images should run first to simulate the issue
        // in practice the user does not control the order of the loaders and it shouldn't matter
        loaders: [l2, l1.loader],
        // this scenario would work
        // loaders: [l1.loader, l2],
        nested: { foo: 'bar' },
      },
      component,
    })

    const wrapper = mount(RouterViewMock, {
      global: {
        plugins: [
          [DataLoaderPlugin, { router }],
          ...(plugins?.(customContext!) || []),
          router,
        ],
      },
    })

    router.push('/fetch?p=one')
    await vi.advanceTimersByTimeAsync(0)
    l1.resolve('search')
    await flushPromises()

    const app: App = wrapper.vm.$.appContext.app
    const l2Data = app.runWithContext(() => l2())

    expect(useDataResult?.data.value).toEqual('search')
    expect(l2Data.data.value).toEqual('search,one')
    expect(l1.spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it.todo('passes to and from to the function version of lazy', async () => {})
  it.todo('can be first non-lazy then lazy', async () => {})
  it.todo('can be first non-lazy then lazy', async () => {})

  // https://github.com/posva/unplugin-vue-router/issues/495
  // in the issue above we have one page with a loader
  // this page is conditionally rendered based on an error state
  // when resetting the error state, there is also a duplicated navigation
  // that invalidates any pendingLoad and renders the page again
  // since there is no navigation, loaders are not called again and
  // there is no pendingLoad
  it('gracefully handles a loader without a pendingLoad', async () => {
    const l1 = mockedLoader({ lazy: false, key: 'l1' })
    const router = getRouter()
    router.addRoute({
      name: 'a',
      path: '/a',
      component: defineComponent({
        setup() {
          const { data } = l1.loader()
          return { data }
        },
        template: `<p>{{ data }}</p>`,
      }),
      meta: {
        loaders: [l1.loader],
        nested: { foo: 'bar' },
      },
    })
    l1.spy.mockResolvedValue('ok')

    const isVisible = ref(true)

    const wrapper = mount(
      () => (isVisible.value ? h(RouterViewMock) : h('p', ['hidden'])),
      {
        global: {
          plugins: [
            [DataLoaderPlugin, { router }],
            ...(plugins?.(customContext!) || []),
            router,
          ],
        },
      }
    )

    await router.push('/a')
    expect(wrapper.text()).toBe('ok')
    isVisible.value = false
    await nextTick()
    expect(wrapper.text()).toBe('hidden')
    await router.push('/a') // failed duplicated navigation
    isVisible.value = true
    await nextTick()
    expect(wrapper.text()).toBe('ok')
  })

  describe('app.runWithContext()', () => {
    it('can inject globals', async () => {
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          async fn() {
            return inject('key', 'ko')
          },
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok')
    })

    it('can inject globals in nested loaders', async () => {
      const nestedLoader = loaderFactory({
        async fn() {
          return inject('key', 'ko')
        },
        key: 'nested',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          async fn() {
            return await nestedLoader()
          },
          key: 'root',
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok')
    })

    it('can inject globals in nested loaders that run after other loaders', async () => {
      const l1 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l1',
      })
      const l2 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l2',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            // this could be written like this, but we allow both for convenience
            // const [a, b] = await Promise.all([l1(), l2()])
            const a = await l1()
            const b = await l2()
            return `${a},${b}`
          },
          key: 'root',
        })
      )
      app.provide('key', 'ok')
      await router.push('/fetch')
      const { data } = useData()
      expect(data.value).toEqual('ok,ok')
    })

    it('can inject globals when reloaded', async () => {
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            return inject('key', 'ko')
          },
        })
      )
      await router.push('/fetch')
      const { data, reload } = useData()
      // we provide afterwards to ensure the nested child is called again
      expect(data.value).not.toBe('ok')
      app.provide('key', 'ok')
      await reload()
      expect(data.value).toBe('ok')
    })

    it('can inject globals in nested loaders when reloaded', async () => {
      const l1 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l1',
      })
      const l2 = loaderFactory({
        fn: async () => {
          return inject('key', 'ko')
        },
        key: 'l2',
      })
      const { router, useData, app } = singleLoaderOneRoute(
        loaderFactory({
          fn: async () => {
            // hmm FIXME: stopped here,
            const [a, b] = await Promise.all([l1(), l2()])
            // const a = await l1()
            // const b = await l2()
            return `${a},${b}`
          },
          key: 'root',
        })
      )
      await router.push('/fetch')
      const { data, reload } = useData()
      // we provide afterwards to ensure the nested child is called again
      expect(data.value).not.toBe('ok,ok')
      app.provide('key', 'ok')
      await reload()
      expect(data.value).toBe('ok,ok')
    })
  })
}
