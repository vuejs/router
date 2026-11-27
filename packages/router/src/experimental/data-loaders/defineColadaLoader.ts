import {
  effectScope,
  getCurrentScope,
  shallowRef,
  watch,
  type ShallowRef,
} from 'vue'
import {
  type EntryKey,
  type UseQueryOptions,
  type UseQueryReturn,
  useQuery,
  defineQuery,
  useQueryCache,
  toCacheKey,
  _toValueWithArgs as toValueWithArgs,
} from '@pinia/colada'
import {
  createDataLoader,
  type DataLoaderContextBase,
  type DataLoaderEntryBase,
  type DefineDataLoaderOptionsBase_DefinedData,
  type DefineDataLoaderOptionsBase_LaxData,
  type DefineLoaderFn,
  type UseDataLoader,
  type UseDataLoaderResult,
} from './createDataLoader'
import type { NavigationResult } from './navigation-result'
import { ABORT_CONTROLLER_KEY, APP_KEY, PENDING_LOCATION_KEY } from './symbols'
import { isSubsetOf, trackRoute, type _PromiseMerged } from './utils'
import type { ErrorDefault } from './types-config'
import type {
  RouteLocationNormalizedLoaded,
  RouteMap,
} from '../../typed-routes'
import { useRouter } from '../../useApi'
import type { LocationQuery } from '../../query'

/**
 * Creates a Pinia Colada data loader with `data` is always defined.
 *
 * @param name - name of the route to have typed routes
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  options: DefineDataColadaLoaderOptions_DefinedData<Name, Data>
): UseDataLoaderColada_DefinedData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is possibly `undefined`.
 *
 * @param name - name of the route to have typed routes
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  options: DefineDataColadaLoaderOptions_LaxData<Name, Data>
): UseDataLoaderColada_LaxData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is always defined.
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Data>(
  options: DefineDataColadaLoaderOptions_DefinedData<keyof RouteMap, Data>
): UseDataLoaderColada_DefinedData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is possibly `undefined`.
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Data>(
  options: DefineDataColadaLoaderOptions_LaxData<keyof RouteMap, Data>
): UseDataLoaderColada_LaxData<Data>

export function defineColadaLoader<Data>(
  nameOrOptions:
    | keyof RouteMap
    | DefineDataColadaLoaderOptions_LaxData<keyof RouteMap, Data>,
  _options?: DefineDataColadaLoaderOptions_LaxData<keyof RouteMap, Data>
): UseDataLoaderColada_LaxData<Data> {
  const options = (_options ||
    nameOrOptions) as DefineDataColadaLoaderOptions_LaxData<
    keyof RouteMap,
    Data
  >
  const { key } = options
  type Entry = DataLoaderColadaEntry<Data, ErrorDefault>

  const useDefinedQuery = defineQuery(() => {
    const router = useRouter()
    const entry = useDataLoader._.getEntry(router) as Entry

    return useQuery({
      ...options,
      query: () => {
        const route = entry.route.value
        const [trackedRoute, params, query, hash] = trackRoute(route)
        entry.tracked.set(toCacheKey(toValueWithArgs(key, trackedRoute)), {
          params,
          query,
          hash,
        })
        // needed for automatic refetching and nested loaders
        return router[APP_KEY].runWithContext(() =>
          options.query(trackedRoute, {
            signal: route.meta[ABORT_CONTROLLER_KEY]?.signal,
          })
        )
      },
      key: () => toValueWithArgs(key, entry.route.value),
    })
  })

  const useDataLoader = createDataLoader<Data, Entry>(options, {
    initial(entry, to) {
      if (entry.ext) return undefined
      entry.route = shallowRef(to)
      entry.tracked = new Map()
      // a scope keeps the defined query alive; it is paused so it does not
      // track the queries as active: only components do
      const scope = effectScope(true)
      const ext = (entry.ext = scope.run(useDefinedQuery)!)
      scope.pause()
      const queryCache = useQueryCache()
      const queryEntry = queryCache.get(toValueWithArgs(key, to))
      queryEntry?.deps.forEach(dep => {
        if ('owner' in dep && dep.owner === scope) {
          queryCache.untrack(queryEntry, dep)
        }
      })
      // hydrated or cached data is used as is
      return ext.data.value
    },

    fetch(entry, to, _router, reload) {
      const { ext } = entry
      if (entry.route.value !== to) {
        // refetch only if a tracked property of the route changed
        const tracked = entry.tracked.get(toCacheKey(toValueWithArgs(key, to)))
        const from = entry.route.value
        // `from` is settled: drop its listener so routes do not retain each other
        from.meta[ABORT_CONTROLLER_KEY]?.signal.removeEventListener(
          'abort',
          entry.restore!
        )
        // binds ext to the query of `to`
        entry.route.value = to
        // a failed navigation binds ext back so it does not sync the query of `to`
        to.meta[ABORT_CONTROLLER_KEY]?.signal.addEventListener(
          'abort',
          (entry.restore = () => {
            if (entry.route.value === to) entry.route.value = from
          })
        )
        reload =
          !tracked ||
          // an ongoing query has incomplete tracked reads
          ext.isLoading.value ||
          !isSubsetOf(tracked.params, to.params) ||
          !isSubsetOf(tracked.query, to.query) ||
          (tracked.hash.v != null && tracked.hash.v !== to.hash)
      }
      return ext[reload ? 'refetch' : 'refresh']().then(() => {
        if (ext.error.value) throw ext.error.value
        return ext.data.value as Data
      })
    },

    extend(entry, router) {
      const { ext } = entry
      // tracks the query for the current component
      useDefinedQuery()
      // sync changes made outside of navigations (e.g. invalidation). Nested
      // loaders have no scope to stop the watchers, components do
      if (getCurrentScope()) {
        for (const prop of ['data', 'error', 'isLoading'] as const) {
          watch(ext[prop], value => {
            if (!router[PENDING_LOCATION_KEY]) {
              ;(entry[prop] as ShallowRef<unknown>).value = value
            }
          })
        }
      }
      const load = (to = router.currentRoute.value, reload?: boolean) =>
        router[APP_KEY]
          .runWithContext(() =>
            useDataLoader._.load(to, router, undefined, undefined, reload)
          )
          .then(() => ext.state.value)
      return {
        refetch: (to?: RouteLocationNormalizedLoaded) => load(to, true),
        refresh: (to?: RouteLocationNormalizedLoaded) => load(to),
        status: ext.status,
        asyncStatus: ext.asyncStatus,
        state: ext.state,
        isPending: ext.isPending,
      }
    },
  }) as UseDataLoaderColada_LaxData<Data>

  return useDataLoader
}

/**
 * Base type with docs for the options of `defineColadaLoader`.
 * @internal
 */
export interface _DefineDataColadaLoaderOptions_Common<
  Name extends keyof RouteMap,
  Data,
> extends Omit<UseQueryOptions<Data, ErrorDefault, Data>, 'query' | 'key'> {
  /**
   * Key associated with the data and passed to pinia colada
   * @param to - Route to load the data
   */
  key: EntryKey | ((to: RouteLocationNormalizedLoaded<Name>) => EntryKey)

  /**
   * Function that returns a promise with the data.
   */
  query: DefineLoaderFn<
    Data,
    DataColadaLoaderContext,
    RouteLocationNormalizedLoaded<Name>
  >
}

/**
 * Options for `defineColadaLoader` when the data is possibly `undefined`.
 */
export interface DefineDataColadaLoaderOptions_LaxData<
  Name extends keyof RouteMap,
  Data,
>
  extends
    _DefineDataColadaLoaderOptions_Common<Name, Data>,
    DefineDataLoaderOptionsBase_LaxData {}

/**
 * Options for `defineColadaLoader` when the data is always defined.
 */
export interface DefineDataColadaLoaderOptions_DefinedData<
  Name extends keyof RouteMap,
  Data,
>
  extends
    _DefineDataColadaLoaderOptions_Common<Name, Data>,
    DefineDataLoaderOptionsBase_DefinedData {}

/**
 * @deprecated Use {@link `DefineDataColadaLoaderOptions_LaxData`} instead.
 */
export type DefineDataColadaLoaderOptions<
  Name extends keyof RouteMap,
  Data,
> = DefineDataColadaLoaderOptions_LaxData<Name, Data>

/**
 * @internal
 */
export interface DataColadaLoaderContext extends DataLoaderContextBase {}

export interface UseDataLoaderColadaResult<
  TData,
  TError = ErrorDefault,
  TDataInitial extends TData | undefined = TData | undefined,
>
  extends
    UseDataLoaderResult<TData | TDataInitial, ErrorDefault>,
    Pick<
      UseQueryReturn<TData, TError, TDataInitial>,
      'isPending' | 'status' | 'asyncStatus' | 'state'
    > {
  /**
   * Equivalent to `useQuery().refetch()`. Refetches the data no matter if its stale or not.
   * @see reload - It also calls `refetch()` but returns an empty promise
   */
  refetch: (
    to?: RouteLocationNormalizedLoaded
  ) => ReturnType<UseQueryReturn<TData, TError, TDataInitial>['refetch']>

  /**
   * Equivalent to `useQuery().refresh()`. Refetches the data **only** if it's stale.
   */
  refresh: (
    to?: RouteLocationNormalizedLoaded
  ) => ReturnType<UseQueryReturn<TData, TError, TDataInitial>['refetch']>
}

/**
 * Data Loader composable returned by `defineColadaLoader()`.
 */
export interface UseDataLoaderColada_LaxData<Data> extends UseDataLoader<
  Data | undefined,
  ErrorDefault
> {
  /**
   * Data Loader composable returned by `defineColadaLoader()`.
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
    Exclude<Data, NavigationResult | undefined>,
    UseDataLoaderColadaResult<Exclude<Data, NavigationResult> | undefined>
  >
}

/**
 * Data Loader composable returned by `defineColadaLoader()`.
 */
export interface UseDataLoaderColada_DefinedData<TData> extends UseDataLoader<
  TData,
  ErrorDefault
> {
  /**
   * Data Loader composable returned by `defineColadaLoader()`.
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
    Exclude<TData, NavigationResult | undefined>,
    UseDataLoaderColadaResult<
      Exclude<TData, NavigationResult>,
      ErrorDefault,
      Exclude<TData, NavigationResult>
    >
  >
}

export interface DataLoaderColadaEntry<
  TData,
  TError = unknown,
  TDataInitial extends TData | undefined = TData | undefined,
> extends DataLoaderEntryBase<TData, TError, TDataInitial> {
  /**
   * Reactive route passed to pinia colada so it automatically refetch
   */
  route: ShallowRef<RouteLocationNormalizedLoaded>

  /**
   * Tracked routes to know when the data should be refreshed. Key is the key of the query.
   */
  tracked: Map<string, TrackedRoute>

  /**
   * Extended options for pinia colada
   */
  ext: UseQueryReturn<TData, TError, TDataInitial>

  /**
   * Binds `ext` back to the previous route when the navigation fails.
   */
  restore?: () => void
}

interface TrackedRoute {
  params: Partial<LocationQuery>
  query: Partial<LocationQuery>
  hash: { v: string | null }
}
