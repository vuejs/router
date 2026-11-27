import type {
  DataLoaderContextBase,
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase_DefinedData,
  DefineDataLoaderOptionsBase_LaxData,
  DefineLoaderFn,
  UseDataLoader,
} from './createDataLoader'
import { createDataLoader } from './createDataLoader'
import { ABORT_CONTROLLER_KEY, INITIAL_DATA_KEY } from './symbols'
import type { ErrorDefault } from './types-config'
import type {
  RouteLocationNormalizedLoaded,
  RouteMap,
} from '../../typed-routes'

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
  loaderOrOptions?:
    | DefineDataLoaderOptions_LaxData
    | DefineDataLoaderOptions_DefinedData
    | DefineLoaderFn<Data, DataLoaderContext>,
  opts?: DefineDataLoaderOptions_LaxData | DefineDataLoaderOptions_DefinedData
): UseDataLoaderBasic_LaxData<Data> | UseDataLoaderBasic_DefinedData<Data> {
  const loader = (
    typeof nameOrLoader === 'function' ? nameOrLoader : loaderOrOptions
  ) as DefineLoaderFn<Data, DataLoaderContext>
  const options: DefineDataLoaderOptions_LaxData =
    (typeof loaderOrOptions === 'object' ? loaderOrOptions : opts) || {}

  return createDataLoader<Data, DataLoaderBasicEntry<Data, ErrorDefault>>(
    options,
    {
      initial(_entry, _to, router) {
        const initialData = router[INITIAL_DATA_KEY]
        const key = options.key!
        let data: Data | undefined
        if (initialData && key in initialData) {
          data = initialData[key] as Data
          delete initialData[key]
        }
        return data
      },
      fetch: (_entry, to) =>
        loader(to, { signal: to.meta[ABORT_CONTROLLER_KEY]?.signal }),
    }
  )
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

export { INITIAL_DATA_KEY }

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
