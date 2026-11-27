import {
  effectScope,
  getCurrentScope,
  shallowRef,
  watch,
  type ShallowRef,
} from 'vue'
import {
  type DefineQueryOptions,
  type UseQueryReturn,
  useQuery,
  defineQuery,
  useQueryCache,
  toCacheKey,
} from '@pinia/colada'
import {
  createDataLoader,
  type DataLoaderContextBase,
  type DataLoaderEntryBase,
  type DefineDataLoaderOptionsBase_DefinedData,
  type DefineDataLoaderOptionsBase_LaxData,
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
 * @param queryOptions - function that returns the query options for a route
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  queryOptions: DefineColadaLoaderQueryOptions<Name, Data>,
  options?: DefineDataColadaLoaderOptions_DefinedData
): UseDataLoaderColada_DefinedData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is possibly `undefined`.
 *
 * @param name - name of the route to have typed routes
 * @param queryOptions - function that returns the query options for a route
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Name extends keyof RouteMap, Data>(
  name: Name,
  queryOptions: DefineColadaLoaderQueryOptions<Name, Data>,
  options: DefineDataColadaLoaderOptions_LaxData
): UseDataLoaderColada_LaxData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is always defined.
 *
 * @param queryOptions - function that returns the query options for a route
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Data>(
  queryOptions: DefineColadaLoaderQueryOptions<keyof RouteMap, Data>,
  options?: DefineDataColadaLoaderOptions_DefinedData
): UseDataLoaderColada_DefinedData<Data>

/**
 * Creates a Pinia Colada data loader with `data` is possibly `undefined`.
 *
 * @param queryOptions - function that returns the query options for a route
 * @param options - options to configure the data loader
 */
export function defineColadaLoader<Data>(
  queryOptions: DefineColadaLoaderQueryOptions<keyof RouteMap, Data>,
  options: DefineDataColadaLoaderOptions_LaxData
): UseDataLoaderColada_LaxData<Data>

export function defineColadaLoader<Data>(
  nameOrQueryOptions:
    | keyof RouteMap
    | DefineColadaLoaderQueryOptions<keyof RouteMap, Data>,
  queryOptionsOrOptions?:
    | DefineColadaLoaderQueryOptions<keyof RouteMap, Data>
    | DefineDataColadaLoaderOptions_LaxData,
  options: DefineDataColadaLoaderOptions_LaxData = {}
): UseDataLoaderColada_LaxData<Data> {
  let queryOptions = queryOptionsOrOptions as DefineColadaLoaderQueryOptions<
    keyof RouteMap,
    Data
  >
  if (typeof nameOrQueryOptions === 'function') {
    options = (queryOptionsOrOptions as typeof options) || {}
    queryOptions = nameOrQueryOptions
  }
  type Entry = DataLoaderColadaEntry<Data, ErrorDefault>

  const getQueryOptions = (to: RouteLocationNormalizedLoaded) =>
    queryOptions(to, { signal: to.meta[ABORT_CONTROLLER_KEY]?.signal })

  const useDefinedQuery = defineQuery(() => {
    const router = useRouter()
    const entry = useDataLoader._.getEntry(router) as Entry

    return useQuery(() => {
      const [trackedRoute, params, query, hash] = trackRoute(entry.route.value)
      const resolved = getQueryOptions(trackedRoute)
      return {
        ...resolved,
        query: context => {
          // reads in the query function are tracked too
          entry.tracked.set(toCacheKey(resolved.key), { params, query, hash })
          // needed for automatic refetching and nested loaders
          return router[APP_KEY].runWithContext(() => resolved.query(context))
        },
      }
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
      const queryEntry = queryCache.get(getQueryOptions(to).key)
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
        const tracked = entry.tracked.get(toCacheKey(getQueryOptions(to).key))
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
 * Function that returns the query options of a Pinia Colada data loader for a
 * route, e.g. created with `defineQueryOptions()`.
 *
 * @param to - Route to load the data
 * @param context - Context of the navigation
 */
export type DefineColadaLoaderQueryOptions<
  Name extends keyof RouteMap,
  Data,
> = (
  to: RouteLocationNormalizedLoaded<Name>,
  context: DataColadaLoaderContext
) => DefineQueryOptions<Data, ErrorDefault, any>

/**
 * Options for `defineColadaLoader` when the data is possibly `undefined`.
 */
export interface DefineDataColadaLoaderOptions_LaxData extends DefineDataLoaderOptionsBase_LaxData {}

/**
 * Options for `defineColadaLoader` when the data is always defined.
 */
export interface DefineDataColadaLoaderOptions_DefinedData extends DefineDataLoaderOptionsBase_DefinedData {}

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
