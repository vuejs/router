import {
  type DataLoaderContextBase,
  type DataLoaderEntryBase,
  type DefineDataLoaderOptionsBase_LaxData,
  type DefineLoaderFn,
  type UseDataLoader,
  type UseDataLoaderResult,
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  IS_USE_DATA_LOADER_KEY,
  LOADER_ENTRIES_KEY,
  NAVIGATION_RESULTS_KEY,
  PENDING_LOCATION_KEY,
  STAGED_NO_VALUE,
  NavigationResult,
  getCurrentContext,
  setCurrentContext,
  IS_SSR_KEY,
  LOADER_SET_KEY,
  type _DefineLoaderEntryMap,
} from './entries/index'

import { shallowRef } from 'vue'
import {
  type DefineDataLoaderOptionsBase_DefinedData,
  toLazyValue,
} from './createDataLoader'
import type { ErrorDefault } from './types-config'
import { warn } from '../../unplugin/core/utils'
import type {
  RouteLocationNormalizedLoaded,
  RouteMap,
} from '../../typed-routes'
import type { Router } from '../../router'
import { useRoute, useRouter } from '../../useApi'

/**
 * Creates a data loader composable that can be exported by pages to attach the data loading to a route. In this version `data` is always defined.
 *
 * @param name - name of the route
 * @param loader - function that returns a promise with the data
 * @param options - options to configure the data loader
 */
export function defineBasicLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  loader: DefineLoaderFn<
    Data,
    DataLoaderContext,
    RouteLocationNormalizedLoaded<Name>
  >,
  options?: DefineDataLoaderOptions_DefinedData
): UseDataLoaderBasic_DefinedData<Data>

/**
 * Creates a data loader composable that can be exported by pages to attach the data loading to a route. In this version, `data` can be `undefined`.
 *
 * @param name - name of the route
 * @param loader - function that returns a promise with the data
 * @param options - options to configure the data loader
 */
export function defineBasicLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  loader: DefineLoaderFn<
    Data,
    DataLoaderContext,
    RouteLocationNormalizedLoaded<Name>
  >,
  options: DefineDataLoaderOptions_LaxData
): UseDataLoaderBasic_LaxData<Data>

/**
 * Creates a data loader composable that can be exported by pages to attach the data loading to a route. In this version `data` is always defined.
 *
 * @param loader - function that returns a promise with the data
 * @param options - options to configure the data loader
 */
export function defineBasicLoader<Data>(
  loader: DefineLoaderFn<
    Data,
    DataLoaderContext,
    RouteLocationNormalizedLoaded
  >,
  options?: DefineDataLoaderOptions_DefinedData
): UseDataLoaderBasic_DefinedData<Data>

/**
 * Creates a data loader composable that can be exported by pages to attach the data loading to a route. In this version, `data` can be `undefined`.
 *
 * @param loader - function that returns a promise with the data
 * @param options - options to configure the data loader
 */
export function defineBasicLoader<Data>(
  loader: DefineLoaderFn<
    Data,
    DataLoaderContext,
    RouteLocationNormalizedLoaded
  >,
  options: DefineDataLoaderOptions_LaxData
): UseDataLoaderBasic_LaxData<Data>

export function defineBasicLoader<Data>(
  nameOrLoader: keyof RouteMap | DefineLoaderFn<Data, DataLoaderContext>,
  _loaderOrOptions?:
    | DefineDataLoaderOptions_LaxData
    | DefineDataLoaderOptions_DefinedData
    | DefineLoaderFn<Data, DataLoaderContext>,
  opts?: DefineDataLoaderOptions_LaxData | DefineDataLoaderOptions_DefinedData
): UseDataLoaderBasic_LaxData<Data> | UseDataLoaderBasic_DefinedData<Data> {
  // TODO: make it DEV only and remove the first argument in production mode
  // resolve option overrides
  const loader =
    typeof nameOrLoader === 'function'
      ? nameOrLoader
      : (_loaderOrOptions! as DefineLoaderFn<Data, DataLoaderContext>)
  opts = typeof _loaderOrOptions === 'object' ? _loaderOrOptions : opts

  const options = {
    ...DEFAULT_DEFINE_LOADER_OPTIONS,
    ...opts,
    // avoid opts overriding with `undefined`
    commit: opts?.commit || DEFAULT_DEFINE_LOADER_OPTIONS.commit,
  } as DefineDataLoaderOptions_LaxData

  function load(
    to: RouteLocationNormalizedLoaded,
    router: Router,
    from?: RouteLocationNormalizedLoaded,
    parent?: DataLoaderEntryBase
  ): Promise<void> {
    // we cast here because we can manipulate our ownn type of entries
    const entries = router[LOADER_ENTRIES_KEY]! as _DefineLoaderEntryMap<
      DataLoaderBasicEntry<unknown>
    >

    const isSSR = router[IS_SSR_KEY]

    // ensure the entry exists
    if (!entries.has(loader)) {
      entries.set(loader, {
        // force the type to match
        data: shallowRef<Data | undefined>(),
        isLoading: shallowRef(false),
        error: shallowRef<ErrorDefault | null>(null),
        to,

        options,
        children: new Set(),
        resetPending() {
          this.pendingLoad = null
          this.pendingTo = null
        },
        pendingLoad: null,
        pendingTo: null,
        staged: STAGED_NO_VALUE,
        stagedError: null,
        stagedNavigationResult: null,
        commit,
      } satisfies DataLoaderBasicEntry<Data, ErrorDefault>)
    }
    const entry = entries.get(loader)!

    // Nested loaders might get called before the navigation guard calls them, so we need to manually skip these calls
    if (entry.pendingTo === to && entry.pendingLoad) {
      // console.log(`🔁 already loading "${options.key}"`)
      return entry.pendingLoad
    }

    const { error, isLoading, data } = entry

    // FIXME: the key should be moved here and the strategy adapted to not depend on the navigation guard. This depends on how other loaders can be implemented.
    const initialRootData = router[INITIAL_DATA_KEY]
    const key = options.key || ''
    let initialData: unknown = STAGED_NO_VALUE
    if (initialRootData && key in initialRootData) {
      initialData = initialRootData[key]
      delete initialRootData[key]
    }

    // we are rendering for the first time and we have initial data
    // we need to synchronously set the value so it's available in components
    // even if it's not exported
    if (initialData !== STAGED_NO_VALUE) {
      data.value = initialData
      // pendingLoad is set for guards to work
      return (entry.pendingLoad = Promise.resolve())
    }

    // console.log(
    //   `😎 Loading context to "${to.fullPath}" with current "${currentContext[2]?.fullPath}"`
    // )
    // Currently load for this loader
    entry.pendingTo = to

    isLoading.value = true
    // save the current context to restore it later
    const currentContext = getCurrentContext()

    if (process.env.NODE_ENV !== 'production') {
      if (parent !== currentContext[0]) {
        console.warn(
          `❌👶 "${options.key}" has a different parent than the current context. This shouldn't be happening. Please report a bug with a reproduction to https://github.com/vuejs/router/`
        )
      }
    }
    // set the current context before loading so nested loaders can use it
    setCurrentContext([entry, router, to])
    entry.staged = STAGED_NO_VALUE
    // preserve error until data is committed
    entry.stagedError = error.value
    entry.stagedNavigationResult = null

    // Promise.resolve() allows loaders to also be sync
    const currentLoad = Promise.resolve(
      loader(to, { signal: to.meta[ABORT_CONTROLLER_KEY]?.signal })
    )
      .then(d => {
        // console.log(
        //   `✅ resolved ${options.key}`,
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad}; data: ${d}`
        // )
        if (entry.pendingLoad === currentLoad) {
          // let the navigation guard collect the result
          if (d instanceof NavigationResult) {
            to.meta[NAVIGATION_RESULTS_KEY]!.push(d)
            entry.stagedNavigationResult = d
            // help users find non-exposed loaders during development
            if (process.env.NODE_ENV !== 'production') {
              warnNonExposedLoader({ to, options, useDataLoader })
            }
          } else {
            entry.staged = d
            entry.stagedError = null
          }
        }
      })
      .catch((error: unknown) => {
        // console.log(
        //   '‼️ rejected',
        //   to.fullPath,
        //   `accepted: ${entry.pendingLoad === currentLoad} =`,
        //   e
        // )
        if (entry.pendingLoad === currentLoad) {
          // help users find non-exposed loaders during development
          if (process.env.NODE_ENV !== 'production') {
            if (error instanceof NavigationResult) {
              warnNonExposedLoader({ to, options, useDataLoader })
            }
          }
          // in this case, commit will never be called so we should just drop the error
          // console.log(`🚨 error in "${options.key}"`, e)
          entry.stagedError = error
          // propagate error if non lazy or during SSR
          // NOTE: Cannot be handled at the guard level because of nested loaders
          if (!toLazyValue(options.lazy, to, from) || isSSR) {
            throw error
          }
        }
      })
      .finally(() => {
        setCurrentContext(currentContext)
        // console.log(
        //   `😩 restored context ${options.key}`,
        //   currentContext?.[2]?.fullPath
        // )
        // TODO: could we replace with signal.aborted?
        if (entry.pendingLoad === currentLoad) {
          isLoading.value = false
          // we must run commit here so nested loaders are ready before used by their parents
          if (
            options.commit === 'immediate' ||
            // outside of navigation
            !router[PENDING_LOCATION_KEY]
          ) {
            entry.commit(to)
          }
        } else {
          // For debugging purposes and refactoring the code
          // console.log(
          //   to.meta[ABORT_CONTROLLER_KEY]!.signal.aborted ? '✅' : '❌'
          // )
        }
      })

    // restore the context after the first tick to avoid lazy loaders to use their own context as parent
    setCurrentContext(currentContext)

    // this still runs before the promise resolves even if loader is sync
    entry.pendingLoad = currentLoad
    // console.log(`🔶 Promise set to pendingLoad "${options.key}"`)

    return currentLoad
  }

  function commit(
    this: DataLoaderBasicEntry<Data, ErrorDefault>,
    to: RouteLocationNormalizedLoaded
  ) {
    if (this.pendingTo === to) {
      // console.log('👉 commit', this.staged)
      if (process.env.NODE_ENV !== 'production') {
        if (
          this.staged === STAGED_NO_VALUE &&
          this.stagedError === null &&
          this.stagedNavigationResult === null
        ) {
          console.warn(
            `Loader "${options.key}"'s "commit()" was called but there is no staged data.`
          )
        }
      }

      // if the entry is null, it means the loader never resolved, maybe there was an error
      if (this.staged !== STAGED_NO_VALUE) {
        this.data.value = this.staged
      }
      // we always commit the error unless the navigation was cancelled
      this.error.value = this.stagedError

      // reset the staged values so they can't be commit
      this.staged = STAGED_NO_VALUE
      // preserve error until data is committed
      this.stagedError = this.error.value
      // we do not restore the stagedNavigationResult intentionally because
      // commit can be called too early depending on the commit value
      this.pendingTo = null
      this.to = to
      // we intentionally keep pendingLoad so it can be reused until the navigation is finished

      // children entries cannot be committed from the navigation guard, so the parent must tell them
      for (const childEntry of this.children) {
        childEntry.commit(to)
      }
    }
  }

  // @ts-expect-error: return type has the generics
  const useDataLoader// for ts
  : UseDataLoaderBasic_LaxData<Data> = () => {
    // work with nested data loaders
    const currentContext = getCurrentContext()
    const [parentEntry, _router, _route] = currentContext
    // fallback to the global router and routes for useDataLoaders used within components
    const router = _router || useRouter()
    const route = _route || (useRoute() as RouteLocationNormalizedLoaded)

    const entries = router[LOADER_ENTRIES_KEY]!
    let entry = entries.get(loader) as
      | DataLoaderBasicEntry<Data, ErrorDefault>
      | undefined

    // console.log(`-- useDataLoader called ${options.key} --`)
    // console.log(
    //   'router pending location',
    //   router[PENDING_LOCATION_KEY]?.fullPath
    // )
    // console.log('target route', route.fullPath)
    // console.log('has parent', !!parentEntry)
    // console.log('has entry', !!entry)
    // console.log('entryLatestLoad', entry?.pendingTo?.fullPath)
    // console.log('is same route', entry?.pendingTo === route)
    // console.log('-- END --')

    if (
      // if the entry doesn't exist, create it with load and ensure it's loading
      !entry ||
      // the existing pending location isn't good, we need to load again
      (parentEntry && entry.pendingTo !== route) ||
      // we could also check for: but that would break nested loaders since they need to be always called to be associated with the parent
      // && entry.to !== route
      // the user managed to render the router view after a valid navigation + a failed navigation
      // https://github.com/posva/unplugin-vue-router/issues/495
      !entry.pendingLoad
    ) {
      // console.log(
      //   `🔁 loading from useData for "${options.key}": "${route.fullPath}"`
      // )
      router[APP_KEY].runWithContext(() =>
        load(route, router, undefined, parentEntry)
      )
    }

    entry = entries.get(loader)! as DataLoaderBasicEntry<Data, ErrorDefault>

    // add ourselves to the parent entry children
    if (parentEntry) {
      if (parentEntry === entry) {
        console.warn(
          `👶❌ "${options.key}" has itself as parent. This shouldn't be happening. Please report a bug with a reproduction to https://github.com/vuejs/router/`
        )
      }
      // console.log(`👶 "${options.key}" has parent ${parentEntry}`)
      parentEntry.children.add(entry!)
    }

    const { data, error, isLoading } = entry

    const useDataLoaderResult = {
      data,
      error,
      isLoading,
      reload: (to: RouteLocationNormalizedLoaded = router.currentRoute.value) =>
        router[APP_KEY]
          .runWithContext(() => load(to, router))
          .then(() => entry!.commit(to)),
    } satisfies UseDataLoaderResult<Data | undefined, ErrorDefault>

    // load ensures there is a pending load
    const promise = entry
      .pendingLoad!.then(() => {
        // nested loaders might wait for all loaders to be ready before setting data
        // so we need to return the staged value if it exists as it will be the latest one
        return entry.staged === STAGED_NO_VALUE
          ? // exclude navigation results from the returned data
            entry.stagedNavigationResult
            ? Promise.reject(entry.stagedNavigationResult)
            : data.value
          : entry.staged
      })
      // we only want the error if we are nesting the loader
      // otherwise this will end up in "Unhandled promise rejection"
      .catch((e: unknown) => (parentEntry ? Promise.reject(e) : null))

    setCurrentContext(currentContext)
    return Object.assign(promise, useDataLoaderResult)
  }

  // mark it as a data loader
  useDataLoader[IS_USE_DATA_LOADER_KEY] = true

  // add the internals
  useDataLoader._ = {
    load,
    options,
    // @ts-expect-error: return type has the generics
    getEntry(router: Router) {
      return router[LOADER_ENTRIES_KEY]!.get(loader)!
    },
  }

  return useDataLoader
}

/**
 * Dev only warning for loaders that return/throw NavigationResult but are not exposed
 *
 * @param to - target location
 * @param options - options used to define the loader
 * @param useDataLoader - the data loader composable
 */
function warnNonExposedLoader({
  to,
  options,
  useDataLoader,
}: {
  to: RouteLocationNormalizedLoaded
  options: DefineDataLoaderOptions_LaxData
  useDataLoader: UseDataLoader
}) {
  const loaders = to.meta[LOADER_SET_KEY]
  if (loaders && !loaders.has(useDataLoader)) {
    warn(
      'A loader returned a NavigationResult but is not registered on the route. Did you forget to "export" it from the page component?' +
        (options.key ? ` (loader key: "${options.key}")` : '')
    )
  }
}

export interface DefineDataLoaderOptions_LaxData extends DefineDataLoaderOptionsBase_LaxData {
  /**
   * Key to use for SSR state. This will be used to read the initial data from `initialData`'s object.
   */
  key?: string
}

export interface DefineDataLoaderOptions_DefinedData extends DefineDataLoaderOptionsBase_DefinedData {
  key?: string
}

/**
 * @deprecated use {@link DefineDataLoaderOptions_LaxData} instead
 */
export type DefineDataLoaderOptions = DefineDataLoaderOptions_LaxData

export interface DataLoaderContext extends DataLoaderContextBase {}

const DEFAULT_DEFINE_LOADER_OPTIONS = {
  lazy: false as boolean,
  server: true,
  commit: 'after-load',
} satisfies
  | DefineDataLoaderOptions_LaxData
  | DefineDataLoaderOptions_DefinedData

/**
 * Symbol used to store the data in the router so it can be retrieved after the initial navigation.
 * @internal
 */
export const SERVER_INITIAL_DATA_KEY = Symbol()

/**
 * Initial data generated on server and consumed on client.
 * @internal
 */
export const INITIAL_DATA_KEY = Symbol()

// TODO: is it better to move this to an ambient declaration file so it's not included in the final bundle?

declare module '../../router' {
  interface Router {
    /**
     * Gives access to the initial state during rendering. Should be set to `false` once it's consumed.
     * @internal
     */
    [SERVER_INITIAL_DATA_KEY]?: Record<string, unknown> | false
    [INITIAL_DATA_KEY]?: Record<string, unknown> | false
  }
}

export interface UseDataLoaderBasic_LaxData<Data> extends UseDataLoader<
  Data | undefined,
  ErrorDefault
> {}

/**
 * @deprecated use {@link UseDataLoaderBasic_LaxData} instead
 */
export type UseDataLoaderBasic<Data> = UseDataLoaderBasic_LaxData<Data>

export interface UseDataLoaderBasic_DefinedData<Data> extends UseDataLoader<
  Data,
  ErrorDefault
> {}

export interface DataLoaderBasicEntry<
  TData,
  TError = unknown,
  TDataInitial extends TData | undefined = TData | undefined,
> extends DataLoaderEntryBase<TData, TError, TDataInitial> {}
