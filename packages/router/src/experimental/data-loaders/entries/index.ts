export type {
  UseDataLoader,
  UseDataLoaderInternals,
  UseDataLoaderResult,
  DataLoaderContextBase,
  DataLoaderEntryBase,
  DefineDataLoaderOptionsBase_LaxData,
  DefineDataLoaderOptionsBase_DefinedData,
  DefineLoaderFn,
  // deprecated
  DefineDataLoaderOptionsBase,
} from '../createDataLoader'
export { toLazyValue } from '../createDataLoader'

// new data fetching
export {
  DataLoaderPlugin,
  NavigationResult,
  useIsDataLoading,
} from '../navigation-guard'
export type {
  DataLoaderPluginOptions,
  SetupLoaderGuardOptions,
  _DataLoaderRedirectResult,
} from '../navigation-guard'

export {
  getCurrentContext,
  setCurrentContext,
  type _PromiseMerged,
  assign,
  isSubsetOf,
  trackRoute,
  withLoaderContext,
  currentContext,
} from '../utils'

// expose all symbols that could be used by loaders
export * from '../meta-extensions'

export type { ErrorDefault } from '../types-config'
