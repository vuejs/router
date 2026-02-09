import {
  effectScope,
  inject,
  shallowRef,
  type InjectionKey,
  type ShallowRef,
  type App,
  type EffectScope,
} from 'vue'
import {
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  DATA_LOADERS_EFFECT_SCOPE_KEY,
  IS_SSR_KEY,
  LOADER_ENTRIES_KEY,
  LOADER_SET_KEY,
  NAVIGATION_RESULTS_KEY,
  PENDING_LOCATION_KEY,
} from './meta-extensions'
import { assign, isDataLoader, setCurrentContext } from './utils'
import { type _Awaitable } from '../../types/utils'
import { toLazyValue, type UseDataLoader } from './createDataLoader'
import {
  NavigationGuard,
  NavigationGuardReturn,
  RouteLocationNormalizedLoaded,
} from '../../typed-routes'
import { isNavigationFailure, NavigationFailureType } from '../../errors'
import { Router } from '../../router'

/**
 * Key to inject the global loading state for loaders used in `useIsDataLoading`.
 * @internal
 */
export const IS_DATA_LOADING_KEY: InjectionKey<ShallowRef<boolean>> = Symbol()

/**
 * TODO: export functions that allow preloading outside of a navigation guard
 */

/**
 * Setups the different Navigation Guards to collect the data loaders from the route records and then to execute them.
 * @internal used by the `DataLoaderPlugin`
 * @see {@link DataLoaderPlugin}
 *
 * @param router - the router instance
 * @returns
 */
export function setupLoaderGuard({
  router,
  app,
  effect: scope,
  isSSR,
  errors: globalErrors = [],
  selectNavigationResult = results => results[0]!.value,
}: SetupLoaderGuardOptions) {
  // avoid creating the guards multiple times
  if (router[LOADER_ENTRIES_KEY] != null) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[vue-router]: Data Loader was setup twice. Make sure to setup only once.'
      )
    }
    return () => {}
  }

  // explicit dev to avoid warnings in tests
  if (process.env.NODE_ENV === 'development' && !isSSR) {
    console.warn(
      '[vue-router]: Data Loader is experimental and subject to breaking changes in the future.'
    )
  }

  // Access to the entries map for convenience
  router[LOADER_ENTRIES_KEY] = new WeakMap()

  // Access to `app.runWithContext()`
  router[APP_KEY] = app

  router[DATA_LOADERS_EFFECT_SCOPE_KEY] = scope
  router[IS_SSR_KEY] = !!isSSR

  // global loading state for loaders used in `useIsDataLoading`
  const isDataLoading = scope.run(() => shallowRef(false))!
  app.provide(IS_DATA_LOADING_KEY, isDataLoading)

  // guard to add the loaders to the meta property
  const removeLoaderGuard = router.beforeEach(to => {
    // Abort any pending navigation. For cancelled navigations, this will happen before the `router.afterEach()`
    if (router[PENDING_LOCATION_KEY]) {
      // we could craft a navigation failure here but vue-router doesn't expose createRouterError() (yet?) and we don't
      // seem to actually need a reason within loaders
      router[PENDING_LOCATION_KEY].meta[ABORT_CONTROLLER_KEY]?.abort()
    }

    // global pending location, used by nested loaders to know if they should load or not
    // NOTE: it becomes loaded afterwards but we might want to set it differently
    router[PENDING_LOCATION_KEY] = to as RouteLocationNormalizedLoaded
    // Differently from records, this one is reset on each navigation
    // so it must be built each time
    to.meta[LOADER_SET_KEY] = new Set()
    // adds an abort controller that can pass a signal to loaders
    to.meta[ABORT_CONTROLLER_KEY] = new AbortController()
    // allow loaders to add navigation results
    to.meta[NAVIGATION_RESULTS_KEY] = []

    // setup the sets for loaders in each record based on the meta.loaders
    for (const record of to.matched) {
      record.meta[LOADER_SET_KEY] ??= new Set(record.meta.loaders || [])
    }
  })

  const removeDataLoaderGuard = router.beforeResolve((to, from) => {
    // TODO: could we benefit anywhere here from verifying the signal is aborted and not call the loaders at all
    // if (to.meta[ABORT_CONTROLLER_KEY]!.signal.aborted) {
    //   return to.meta[ABORT_CONTROLLER_KEY]!.signal.reason ?? false
    // }

    // if we reach this guard, all properties have been set
    // we can collect all loaders from records, modules and components
    for (const record of to.matched) {
      // colect all loaders from the record's meta
      for (const loader of record.meta[LOADER_SET_KEY]!) {
        to.meta[LOADER_SET_KEY]!.add(loader)
      }

      // add all the loaders from the components to the set
      for (const componentName in record.mods) {
        const viewModule = record.mods[componentName] as Record<string, unknown>

        // avoid checking functional components
        for (const exportName in viewModule) {
          const exportValue = viewModule[exportName]

          if (isDataLoader(exportValue)) {
            to.meta[LOADER_SET_KEY]!.add(exportValue)
            // loaderSet.add(exportValue)
          }
        }
        // TODO: remove once nuxt doesn't wrap with `e => e.default` async pages
        const component = record.components?.[componentName] as
          | undefined
          | Record<string, unknown>
        if (component && Array.isArray(component.__loaders)) {
          for (const loader of component.__loaders) {
            if (isDataLoader(loader)) {
              to.meta[LOADER_SET_KEY]!.add(loader)
              // loaderSet.add(loader)
            }
          }
        }
      }
    }

    const loaders: UseDataLoader[] = Array.from(to.meta[LOADER_SET_KEY]!)
    const { signal } = to.meta[ABORT_CONTROLLER_KEY]!

    // unset the context so all loaders are executed as root loaders
    setCurrentContext([])

    isDataLoading.value = true

    return Promise.all(
      loaders.map(loader => {
        const { server, lazy, errors } = loader._.options
        // do not run on the server if specified
        if (!server && isSSR) {
          return
        }
        // keep track of loaders that should be committed after all loaders are done
        const ret = scope.run(() =>
          app
            // allows inject and provide APIs
            .runWithContext(() => loader._.load(to, router, from))
        )!

        // on client-side, lazy loaders are not awaited, but on server they are
        // we already checked for the `server` option above
        return !isSSR && toLazyValue(lazy, to, from)
          ? undefined
          : // return the non-lazy loader to commit changes after all loaders are done
            ret.catch(reason => {
              // errors: true, accept globally defined errors
              if (errors === true) {
                // is the error a globally expected error
                if (
                  Array.isArray(globalErrors)
                    ? globalErrors.some(Err => reason instanceof Err)
                    : globalErrors(reason)
                )
                  return
              } else if (
                errors && // errors != false
                // use local error option if it exists first and then the global one
                (Array.isArray(errors)
                  ? errors.some(Err => reason instanceof Err)
                  : errors(reason))
              ) {
                return
              }
              // by default, the error is not handled
              throw reason
            })
      })
    ) // let the navigation go through by returning true or void
      .then(results => {
        if (process.env.NODE_ENV !== 'production') {
          for (const result of results as unknown[]) {
            if (result instanceof NavigationResult) {
              console.warn(
                '[vue-router]: Returning a NavigationResult from a loader is deprecated. Use reroute() instead, which throws internally.'
              )
            }
            throw result
          }
        }
        if (to.meta[NAVIGATION_RESULTS_KEY]!.length) {
          return selectNavigationResult(to.meta[NAVIGATION_RESULTS_KEY]!)
        }
      })
      .catch(error =>
        error instanceof NavigationResult
          ? // TODO: why? add comment explaining
            error.value
          : // we don't want to propagate an error if it was our own abort signal
            // this includes cancelled navigations + signal.throwIfAborted() calls
            signal.aborted && error === signal.reason
            ? false
            : // let the error propagate to router.onError()
              // we use never because the rejection means we never resolve a value and using anything else
              // will not be valid from the navigation guard's perspective
              Promise.reject<never>(error)
      )
      .finally(() => {
        // unset the context so mounting happens without an active context
        // and loaders do not believe they are being called as nested when they are not
        setCurrentContext([])
        isDataLoading.value = false
      })
  })

  // listen to duplicated navigation failures to reset the pendingTo and pendingLoad
  // since they won't trigger the beforeEach or beforeResolve defined above
  const removeAfterEach = router.afterEach((to, from, failure) => {
    // console.log(
    //   `🔚 afterEach "${_from.fullPath}" -> "${to.fullPath}": ${failure?.message}`
    // )
    if (failure) {
      // abort the signal of a failed navigation
      // we need to check if it exists because the navigation guard that creates
      // the abort controller could not be triggered depending on the failure
      to.meta[ABORT_CONTROLLER_KEY]?.abort(failure)

      if (
        // NOTE: using a smaller version to cutoff some bytes
        isNavigationFailure(failure, NavigationFailureType.duplicated)
      ) {
        for (const loader of to.meta[LOADER_SET_KEY]!) {
          const entry = loader._.getEntry(router)
          entry.resetPending()
        }
      }
    } else {
      for (const loader of to.meta[LOADER_SET_KEY]!) {
        const { commit, lazy } = loader._.options
        if (commit === 'after-load') {
          const entry = loader._.getEntry(router)
          // lazy loaders do not block the navigation so the navigation guard
          // might call commit before the loader is ready
          // on the server, entries might not even exist
          if (
            entry &&
            (!toLazyValue(lazy, to, from) || !entry.isLoading.value)
          ) {
            entry.commit(to)
          }
        }
      }
    }

    // avoid this navigation being considered valid by the loaders
    // Cast needed: typed routes comparison
    if (router[PENDING_LOCATION_KEY] === to) {
      router[PENDING_LOCATION_KEY] = null
    }
  })

  // abort the signal on thrown errors
  const removeOnError = router.onError((error, to) => {
    // same as with afterEach, we check if it exists because the navigation guard
    // that creates the abort controller could not be triggered depending on the error
    to.meta[ABORT_CONTROLLER_KEY]?.abort(error)
    // avoid this navigation being considered valid by the loaders
    // Cast needed: typed routes comparison
    if (router[PENDING_LOCATION_KEY] === to) {
      router[PENDING_LOCATION_KEY] = null
    }
  })

  return () => {
    // @ts-expect-error: must be there in practice
    delete router[LOADER_ENTRIES_KEY]
    // @ts-expect-error: must be there in practice
    delete router[APP_KEY]
    removeLoaderGuard()
    removeDataLoaderGuard()
    removeAfterEach()
    removeOnError()
  }
}

/**
 * Allows differentiating lazy components from functional components and vue-class-component
 * @internal
 *
 * @param component
 */
export function isAsyncModule(
  asyncMod: unknown
): asyncMod is () => Promise<Record<string, unknown>> {
  return (
    typeof asyncMod === 'function' &&
    // vue functional components
    !('displayName' in asyncMod) &&
    !('props' in asyncMod) &&
    !('emits' in asyncMod) &&
    !('__vccOpts' in asyncMod)
  )
}

/**
 * Options to initialize the data loader guard.
 */
export interface SetupLoaderGuardOptions extends DataLoaderPluginOptions {
  /**
   * The Vue app instance. Used to access the `provide` and `inject` APIs.
   */
  app: App<unknown>

  /**
   * The effect scope to use for the data loaders.
   */
  effect: EffectScope
}

/**
 * Possible values to change the result of a navigation within a loader
 * @internal
 */
export type _DataLoaderRedirectResult = Exclude<
  ReturnType<NavigationGuard>,
  // only preserve values that cancel the navigation
  Promise<unknown> | Function | true | void | undefined
>

/**
 * Allows data loaders to change navigation. Called by {@link reroute}.
 *
 * @internal
 */
export class NavigationResult {
  constructor(public readonly value: _DataLoaderRedirectResult) {}
}

/**
 * Changes the navigation from within a data loader. Accepts the same values as a navigation
 * guard return: a route location to redirect to, or `false` to cancel the navigation.
 *
 * @example
 * ```ts
 * export const useUserData = defineBasicLoader(async (to) => {
 *   const user = await fetchUser(to.params.id)
 *   if (!user) {
 *     reroute('/404')
 *   }
 *   return user
 * })
 * ```
 */
export function reroute(to: _DataLoaderRedirectResult): never {
  throw new NavigationResult(to)
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
  const effect = effectScope(true)
  const removeGuards = setupLoaderGuard(assign({ app, effect }, options))

  // TODO: use https://github.com/vuejs/core/pull/8801 if merged
  const { unmount } = app
  app.unmount = () => {
    effect.stop()
    removeGuards()
    unmount.call(app)
  }
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
   * Called if any data loader returns a `NavigationResult` with an array of them. Should decide what is the outcome of
   * the data fetching guard. Note this isn't called if no data loaders return a `NavigationResult` or if an error is thrown.
   * @defaultValue `(results) => results[0].value`
   */
  selectNavigationResult?: (
    results: NavigationResult[]
  ) => _Awaitable<Exclude<NavigationGuardReturn, Function | Promise<unknown>>>

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
