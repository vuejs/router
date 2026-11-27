import {
  inject,
  shallowRef,
  type App,
  type InjectionKey,
  type ShallowRef,
} from 'vue'
import {
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  IS_SSR_KEY,
  LOADER_SET_KEY,
  PENDING_LOCATION_KEY,
} from './symbols'
import { isDataLoader, setCurrentContext } from './utils'
import { toLazyValue, type UseDataLoader } from './createDataLoader'
import { NavigationResult } from './navigation-result'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import type { Router } from '../../router'
import { diagnostics } from '../../diagnostics'

export {
  NavigationResult,
  reroute,
  type _DataLoaderRedirectResult,
} from './navigation-result'

/**
 * Key to inject the global loading state for loaders used in `useIsDataLoading`.
 * @internal
 */
export const IS_DATA_LOADING_KEY: InjectionKey<ShallowRef<boolean>> = Symbol()

/**
 * Setups the different Navigation Guards to collect the data loaders from the route records and then to execute them.
 * @internal used by the `DataLoaderPlugin`
 * @see {@link DataLoaderPlugin}
 */
export function setupLoaderGuard(
  app: App,
  { router, isSSR, errors: globalErrors }: DataLoaderPluginOptions
) {
  if (router[APP_KEY]) {
    if (__DEV__) diagnostics.VUE_ROUTER_R1007()
    return () => {}
  }

  // explicit dev to avoid warnings in tests
  if (process.env.NODE_ENV === 'development' && !isSSR) {
    diagnostics.VUE_ROUTER_R1008()
  }

  router[APP_KEY] = app
  router[IS_SSR_KEY] = !!isSSR

  const isDataLoading = shallowRef(false)
  app.provide(IS_DATA_LOADING_KEY, isDataLoading)

  const removeBeforeEach = router.beforeEach(to => {
    // a new navigation cancels the pending one
    router[PENDING_LOCATION_KEY]?.meta[ABORT_CONTROLLER_KEY]?.abort()
    router[PENDING_LOCATION_KEY] = to as RouteLocationNormalizedLoaded
    to.meta[LOADER_SET_KEY] = new Set()
    to.meta[ABORT_CONTROLLER_KEY] = new AbortController()
  })

  const removeBeforeResolve = router.beforeResolve((to, from) => {
    // lazy components are resolved: collect loaders from records and modules
    const loaders = to.meta[LOADER_SET_KEY]!
    for (const record of to.matched) {
      for (const loader of record.meta.loaders || []) loaders.add(loader)
      for (const name in record.mods) {
        const mod = record.mods[name] as Record<string, unknown>
        for (const exportName in mod) {
          if (isDataLoader(mod[exportName])) loaders.add(mod[exportName])
        }
        // TODO: remove once nuxt doesn't wrap with `e => e.default` async pages
        for (const loader of (record.components?.[name] as any)?.__loaders ||
          []) {
          if (isDataLoader(loader)) loaders.add(loader)
        }
      }
    }

    const { signal } = to.meta[ABORT_CONTROLLER_KEY]!
    // all loaders are executed as root loaders
    setCurrentContext([])
    isDataLoading.value = true

    return Promise.all(
      [...loaders].map(loader => {
        const { server, lazy, errors } = loader._.options
        if (isSSR && server === false) return
        const load = app.runWithContext(() => loader._.load(to, router, from))
        // lazy loaders only block on the server
        return !isSSR && toLazyValue(lazy, to, from)
          ? undefined
          : load.catch(reason => {
              const expected = errors === true ? globalErrors : errors
              if (
                expected &&
                (Array.isArray(expected)
                  ? expected.some(Err => reason instanceof Err)
                  : expected(reason))
              )
                return
              throw reason
            })
      })
    )
      .then(
        // an array would be a redirect for the guard
        () => {},
        error =>
          error instanceof NavigationResult
            ? // a redirect to the current location skips afterEach for `to`
              (end(to, error), error.value)
            : // our own abort signal cancels the navigation without an error
              signal.aborted && error === signal.reason
              ? false
              : Promise.reject<never>(error)
      )
      .finally(() => {
        setCurrentContext([])
        isDataLoading.value = false
      })
  })

  function end(to: RouteLocationNormalizedLoaded, failure?: unknown) {
    // the guards might not have run depending on the failure
    if (failure) to.meta[ABORT_CONTROLLER_KEY]?.abort(failure)
    if (router[PENDING_LOCATION_KEY] === to) router[PENDING_LOCATION_KEY] = null
  }

  const removeAfterEach = router.afterEach((to, from, failure) => {
    if (!failure) {
      for (const loader of to.meta[LOADER_SET_KEY]!) {
        // server: false loaders have no entry on the server
        loader._.getEntry(router)?.commit(to)
      }
    }
    end(to, failure)
  })

  const removeOnError = router.onError((error, to) => end(to, error))

  return () => {
    // @ts-expect-error: must be there in practice
    delete router[APP_KEY]
    removeBeforeEach()
    removeBeforeResolve()
    removeAfterEach()
    removeOnError()
  }
}

/**
 * Options to initialize the data loader guard.
 */
export interface SetupLoaderGuardOptions extends DataLoaderPluginOptions {
  /**
   * The Vue app instance. Used to access the `provide` and `inject` APIs.
   */
  app: App<unknown>
}

/**
 * Data Loader plugin to add data loading support to Vue Router.
 *
 * @example
 * ```ts
 * const router = createRouter({
 *   routes,
 *   history: createWebHistory(),
 * })
 *
 * const app = createApp({})
 * app.use(DataLoaderPlugin, { router })
 * app.use(router)
 * ```
 */
export function DataLoaderPlugin(app: App, options: DataLoaderPluginOptions) {
  app.onUnmount(setupLoaderGuard(app, options))
}

/**
 * Options passed to the DataLoaderPlugin.
 */
export interface DataLoaderPluginOptions {
  /**
   * The router instance. Adds the guards to it
   */
  router: Router

  isSSR?: boolean

  /**
   * List of _expected_ errors that shouldn't abort the navigation (for non-lazy loaders). Provide a list of
   * constructors that can be checked with `instanceof` or a custom function that returns `true` for expected errors.
   */
  errors?: Array<new (...args: any) => any> | ((reason?: unknown) => boolean)
}

/**
 * Return a ref that reflects the global loading state of all loaders within a navigation.
 * This state doesn't update if `refresh()` is manually called.
 */
export function useIsDataLoading() {
  return inject(IS_DATA_LOADING_KEY)!
}

export type { UseDataLoader }
