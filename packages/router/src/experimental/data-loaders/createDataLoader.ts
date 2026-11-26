import { getCurrentInstance, shallowRef, type ShallowRef } from 'vue'
import type { Router } from '../../router'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import { useRoute, useRouter } from '../../useApi'
import { assign } from '../../utils'
import { diagnostics } from '../../diagnostics'
import { NavigationResult } from './navigation-result'
import {
  ABORT_CONTROLLER_KEY,
  APP_KEY,
  IS_SSR_KEY,
  IS_USE_DATA_LOADER_KEY,
  LOADER_SET_KEY,
  PENDING_LOCATION_KEY,
  STAGED_NO_VALUE,
} from './symbols'
import {
  getCurrentContext,
  setCurrentContext,
  type _PromiseMerged,
} from './utils'
import type { ErrorDefault } from './types-config'

/**
 * Hooks that differentiate one data loader implementation from another. The
 * shared lifecycle (entries, staging, commit, nesting) lives in
 * {@link createDataLoader}.
 */
export interface DataLoaderImplementation<
  TData,
  TEntry extends DataLoaderEntryBase<TData, ErrorDefault>,
> {
  /**
   * Returns data that is already available (e.g. SSR hydration) to skip the
   * fetch, or `undefined` to fetch. Called before every fetch.
   */
  initial(
    entry: TEntry,
    to: RouteLocationNormalizedLoaded,
    router: Router
  ): TData | undefined

  /**
   * Fetches the data for `to`.
   *
   * @param reload - force a new fetch even if the implementation has a cache
   */
  fetch(
    entry: TEntry,
    to: RouteLocationNormalizedLoaded,
    router: Router,
    reload?: boolean
  ): Promise<TData>

  /**
   * Extra properties added to the object returned by the composable.
   */
  extend?(entry: TEntry, router: Router): Record<string, unknown>
}

/**
 * Creates a data loader composable from an implementation. Used by
 * `defineBasicLoader()` and `defineColadaLoader()`.
 *
 * @param options - resolved loader options
 * @param impl - implementation hooks
 */
/**
 * Number of loader functions running synchronously. Outside of them, a
 * context is a leftover of a loader awaiting something else.
 */
let running = 0

export function createDataLoader<
  TData,
  TEntry extends DataLoaderEntryBase<TData, ErrorDefault>,
>(
  options: DefineDataLoaderOptionsBase_LaxData & { key?: unknown },
  { initial, fetch, extend }: DataLoaderImplementation<TData, TEntry>
): UseDataLoader<TData | undefined, ErrorDefault> {
  const entries = new WeakMap<Router, TEntry>()

  function load(
    to: RouteLocationNormalizedLoaded,
    router: Router,
    from?: RouteLocationNormalizedLoaded,
    parent?: DataLoaderEntryBase,
    reload?: boolean
  ): Promise<void> {
    let entry = entries.get(router)!
    if (!entry) {
      entries.set(
        router,
        (entry = {
          data: shallowRef(),
          error: shallowRef(null),
          isLoading: shallowRef(false),
          children: new Set(),
          staged: STAGED_NO_VALUE,
          stagedError: null,
          commit,
        } as TEntry)
      )
    }

    // nested loaders and the guard can both ask for the same navigation
    if (entry.pendingTo === to) return entry.pendingLoad!

    const context = getCurrentContext()
    if (__DEV__ && parent && parent !== context[0]) {
      diagnostics.VUE_ROUTER_R1001({ key: String(options.key) })
    }
    // nested loaders read their parent from the context
    setCurrentContext([entry, router, to])
    entry.pendingTo = to

    const initialData = initial(entry, to, router)
    if (initialData !== undefined) {
      entry.data.value = initialData
      setCurrentContext(context)
      return (entry.pendingLoad = Promise.resolve())
    }

    entry.isLoading.value = true
    entry.staged = STAGED_NO_VALUE
    // keep the error until new data is committed
    entry.stagedError = entry.error.value

    // runs after the fetch settles, with the same timing in both branches
    const settle = (fn: () => void) => {
      setCurrentContext(context)
      // a newer load replaced this one: its result is discarded
      if (entry.pendingLoad === pendingLoad) {
        try {
          fn()
        } finally {
          entry.isLoading.value = false
          // loads outside of a navigation (reload, lazy) commit themselves
          if (
            !to.meta[ABORT_CONTROLLER_KEY]?.signal.aborted &&
            (options.commit === 'immediate' ||
              to !== router[PENDING_LOCATION_KEY])
          ) {
            entry.commit(to)
          }
        }
      }
    }

    // loaders are async: they cannot throw synchronously
    running++
    const result = fetch(entry, to, router, reload)
    running--
    const pendingLoad: Promise<void> = Promise.resolve(result).then(
      data =>
        settle(() => {
          if (data instanceof NavigationResult) {
            if (__DEV__) {
              diagnostics.VUE_ROUTER_R1002()
              warnNonExposedLoader(to)
            }
            throw data
          }
          entry.staged = data
          entry.stagedError = null
        }),
      (error: unknown) =>
        settle(() => {
          if (error instanceof NavigationResult) {
            if (__DEV__) warnNonExposedLoader(to)
            throw error
          }
          entry.stagedError = error as ErrorDefault
          // lazy loaders do not block the navigation, so they keep the error
          if (!toLazyValue(options.lazy, to, from) || router[IS_SSR_KEY]) {
            throw error
          }
        })
    )

    // the loader function ran until its first await with the loader context
    setCurrentContext(context)
    return (entry.pendingLoad = pendingLoad)
  }

  function commit(this: TEntry, to: RouteLocationNormalizedLoaded) {
    // a lazy loader can still be loading when the navigation ends: it commits itself later
    if (this.pendingTo === to && !this.isLoading.value) {
      if (this.staged !== STAGED_NO_VALUE) {
        this.data.value = this.staged
        this.staged = STAGED_NO_VALUE
      }
      this.error.value = this.stagedError
      // allows a new load for the same location (reload)
      this.pendingTo = null
      // the guard only knows about root loaders
      for (const child of this.children) child.commit(to)
    }
  }

  function warnNonExposedLoader(to: RouteLocationNormalizedLoaded) {
    const loaders = to.meta[LOADER_SET_KEY]
    if (loaders && !loaders.has(useDataLoader)) {
      diagnostics.VUE_ROUTER_R1004({
        key: options.key ? ` (loader key: "${String(options.key)}")` : '',
      })
    }
  }

  const useDataLoader = (() => {
    // a component is never nested: in browsers the context is a global that a
    // suspended lazy loader leaves behind
    const context: ReturnType<typeof getCurrentContext> =
      getCurrentInstance() && !running ? [] : getCurrentContext()
    const [parentEntry, _router, _route] = context
    // fallback to the global router and route when used in components
    const router = _router || useRouter()
    const route = _route || (useRoute() as RouteLocationNormalizedLoaded)
    let entry = entries.get(router)

    if (
      !entry ||
      // nested loader of a new navigation
      (parentEntry && entry.pendingTo !== route)
    ) {
      router[APP_KEY].runWithContext(() =>
        load(route, router, undefined, parentEntry, !!entry)
      )
      entry = entries.get(router)!
    }

    if (parentEntry) {
      if (__DEV__ && parentEntry === entry) {
        diagnostics.VUE_ROUTER_R1005({ key: String(options.key) })
      }
      parentEntry.children.add(entry)
    }

    const { data, error, isLoading } = entry
    const promise = entry
      .pendingLoad!.then(
        // nested loaders need the latest value even if it is not committed yet
        () => (entry.staged === STAGED_NO_VALUE ? data.value : entry.staged),
        // only nested loaders handle the rejection, otherwise it would be unhandled
        e => (parentEntry ? Promise.reject(e) : null)
      )
      // restore the caller's context so sequential awaits keep the parent
      .finally(() => setCurrentContext(context))

    setCurrentContext(context)
    return assign(
      promise,
      {
        data,
        error,
        isLoading,
        // commits itself because it is not part of the navigation
        reload: (
          to: RouteLocationNormalizedLoaded = router.currentRoute.value
        ) =>
          router[APP_KEY].runWithContext(() =>
            load(to, router, undefined, undefined, true)
          ),
      },
      extend && extend(entry, router)
    )
  }) as unknown as UseDataLoader<TData | undefined, ErrorDefault>

  useDataLoader[IS_USE_DATA_LOADER_KEY] = true
  useDataLoader._ = {
    load,
    options,
    getEntry: router => entries.get(router) as any,
  }

  return useDataLoader
}

/**
 * Base type for a data loader entry. Each Data Loader has one entry per router.
 */
export interface DataLoaderEntryBase<
  TData = unknown,
  TError = unknown,
  TDataInitial extends TData | undefined = TData | undefined,
> {
  /**
   * Data stored in the entry.
   */
  data: ShallowRef<TData | TDataInitial>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<TError | null>

  /**
   * Whether there is an ongoing request.
   */
  isLoading: ShallowRef<boolean>

  /**
   * The latest load. Allows to verify if a load is still valid when it resolves.
   */
  pendingLoad?: Promise<void>

  /**
   * Location of the latest load. Used to skip duplicated loads for the same
   * navigation and to commit only the data of that navigation. Reset to `null`
   * when the data is committed.
   */
  pendingTo?: RouteLocationNormalizedLoaded | null

  /**
   * Data that was staged by a loader. This is used to avoid showing the old data while the new data is loading. Calling
   * the internal `commit()` function will replace the data with the staged data.
   */
  staged: TData | typeof STAGED_NO_VALUE

  /**
   * Error that was staged by a loader. This is used to avoid showing the old error while the new data is loading.
   * Calling the internal `commit()` function will replace the error with the staged error.
   */
  stagedError: TError | null

  /**
   * Other data loaders that depend on this one. They are committed with this one.
   */
  children: Set<DataLoaderEntryBase>

  /**
   * Commits the pending data to the entry. This is called by the navigation guard when all non-lazy loaders have
   * finished loading. It **must be called** from the entry itself: `entry.commit(to)`.
   */
  commit(to: RouteLocationNormalizedLoaded): void
}

/**
 * Common properties for the options of `defineLoader()`. Types are `unknown` to allow for more specific types in the
 * extended types while having documentation in one single place.
 * @internal
 */
export interface _DefineDataLoaderOptionsBase_Common {
  /**
   * When the data should be committed to the entry. In the case of lazy loaders, the loader will try to commit the data
   * after all non-lazy loaders have finished loading, but it might not be able to if the lazy loader hasn't been
   * resolved yet.
   *
   * @see {@link DefineDataLoaderCommit}
   * @defaultValue `'after-load'`
   */
  commit?: DefineDataLoaderCommit

  /**
   * Whether the data should be lazy loaded without blocking the client side navigation or not. When set to true, the loader will no longer block the navigation and the returned composable can be called even
   * without having the data ready.
   *
   * @defaultValue `false`
   */
  lazy?: unknown

  /**
   * Whether this loader should be awaited on the server side or not. Combined with the `lazy` option, this gives full
   * control over how to await for the data.
   *
   * @defaultValue `true`
   */
  server?: unknown

  /**
   * List of _expected_ errors that shouldn't abort the navigation (for non-lazy loaders). Provide a list of
   * constructors that can be checked with `instanceof` or a custom function that returns `true` for expected errors. Can also be set to `true` to accept all globally defined errors. Defaults to `false` to abort on any error.
   * @default `false`
   */
  errors?: unknown
}

/**
 * Options for a data loader that returns a data that is possibly `undefined`. Available for data loaders
 * implementations so they can be used in `defineLoader()` overloads.
 */
export interface DefineDataLoaderOptionsBase_LaxData extends _DefineDataLoaderOptionsBase_Common {
  lazy?:
    | boolean
    | ((
        to: RouteLocationNormalizedLoaded,
        from?: RouteLocationNormalizedLoaded
      ) => boolean)

  server?: boolean

  errors?:
    | boolean
    // array of constructors
    | Array<new (...args: any[]) => any>
    // custom type guard
    | ((reason?: unknown) => boolean)
}

/**
 * Options for a data loader making the data defined without it being possibly `undefined`. Available for data loaders
 * implementations so they can be used in `defineLoader()` overloads.
 */
export interface DefineDataLoaderOptionsBase_DefinedData extends _DefineDataLoaderOptionsBase_Common {
  lazy?: false
  server?: true
  errors?: false
}

export const toLazyValue = (
  lazy: undefined | DefineDataLoaderOptionsBase_LaxData['lazy'],
  to: RouteLocationNormalizedLoaded,
  from?: RouteLocationNormalizedLoaded
) => (typeof lazy === 'function' ? lazy(to, from) : lazy)

/**
 * When the data should be committed to the entry.
 * - `immediate`: the data is committed as soon as it is loaded.
 * - `after-load`: the data is committed after all non-lazy loaders have finished loading.
 */
export type DefineDataLoaderCommit = 'immediate' | 'after-load'

export interface DataLoaderContextBase {
  /**
   * Signal associated with the current navigation. It is aborted when the navigation is canceled or an error occurs.
   */
  signal: AbortSignal | undefined
}

/**
 * Data Loader composable returned by `defineLoader()`.
 */
export interface UseDataLoader<Data = unknown, TError = unknown> {
  [IS_USE_DATA_LOADER_KEY]: true

  /**
   * Data Loader composable returned by `defineLoader()`.
   *
   * @example
   * Returns the Data loader data, isLoading, error etc. Meant to be used in `setup()` or `<script setup>` **without `await`**:
   * ```vue
   * <script setup>
   * const { data, isLoading, error } = useUserData()
   * </script>
   * ```
   *
   * @example
   * It also returns a promise of the data when used in nested loaders. Note this `data` is **not a ref**. This is not meant to be used in `setup()` or `<script setup>`.
   * ```ts
   * export const useUserConnections = defineLoader(async () => {
   *   const user = await useUserData()
   *   return fetchUserConnections(user.id)
   * })
   * ```
   */
  (): _PromiseMerged<
    // we can await the raw data
    // excluding NavigationResult allows to ignore it in the type of Data when doing
    // `return new NavigationResult()` in the loader
    // excluding `undefined` allows to await for lazy loaders and others
    Exclude<Data, NavigationResult | undefined>,
    // or use it as a composable
    UseDataLoaderResult<Exclude<Data, NavigationResult>, TError>
  >

  /**
   * Internals of the data loader.
   * @internal
   */
  _: UseDataLoaderInternals<Exclude<Data, NavigationResult | undefined>, TError>
}

/**
 * Internal properties of a data loader composable. Used by the internal implementation of `defineLoader()`. **Should
 * not be used in application code.**
 */
export interface UseDataLoaderInternals<Data = unknown, TError = unknown> {
  /**
   * Loads the data from the cache if possible, otherwise loads it from the loader and awaits it.
   *
   * @param to - route location to load the data for
   * @param router - router instance
   * @param from - route location we are coming from
   * @param parent - parent data loader entry
   * @param reload - force a new fetch
   */
  load: (
    to: RouteLocationNormalizedLoaded,
    router: Router,
    from?: RouteLocationNormalizedLoaded,
    parent?: DataLoaderEntryBase,
    reload?: boolean
  ) => Promise<void>

  /**
   * Resolved options for the loader.
   */
  options: DefineDataLoaderOptionsBase_LaxData

  /**
   * Gets the entry associated with the router instance. Assumes the data loader has been loaded and that the entry
   * exists.
   *
   * @param router - router instance
   */
  getEntry(router: Router): DataLoaderEntryBase<Data, TError>
}

/**
 * Return value of a loader composable defined with `defineLoader()`.
 */
export interface UseDataLoaderResult<TData = unknown, TError = ErrorDefault> {
  /**
   * Data returned by the loader. If the data loader is lazy, it will be undefined until the first load.
   */
  data: ShallowRef<TData>

  /**
   * Whether there is an ongoing request.
   */
  isLoading: ShallowRef<boolean>

  /**
   * Error if there was an error.
   */
  error: ShallowRef<TError | null>

  /**
   * Reload the data using the current route location. Returns a promise that resolves when the data is reloaded. This
   * method should not be called during a navigation as it can conflict with an ongoing load and lead to
   * inconsistencies.
   */
  reload(): Promise<void>
  /**
   * Reload the data using the route location passed as argument. Returns a promise that resolves when the data is reloaded.
   *
   * @param route - route location to load the data for
   */
  reload(route: RouteLocationNormalizedLoaded): Promise<void>
}

/**
 * Loader function that can be passed to `defineLoader()`.
 */
export interface DefineLoaderFn<
  Data,
  Context extends DataLoaderContextBase = DataLoaderContextBase,
  Route = RouteLocationNormalizedLoaded,
> {
  (route: Route, context: Context): Promise<Data>
}

/**
 * @deprecated Use `DefineDataLoaderOptionsBase_LaxData` instead.
 */
export type DefineDataLoaderOptionsBase = DefineDataLoaderOptionsBase_LaxData
