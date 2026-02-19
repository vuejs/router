export { experimental_createRouter, normalizeRouteRecord } from './router'
export type {
  EXPERIMENTAL_Router_Base,
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouteRecordNormalized,
  EXPERIMENTAL_RouterOptions_Base,
  EXPERIMENTAL_RouterOptions,
  EXPERIMENTAL_RouteRecordRaw,
  EXPERIMENTAL_RouteRecord_Base,
  EXPERIMENTAL_RouteRecord_Group,
  EXPERIMENTAL_RouteRecordNormalized_Group,
  EXPERIMENTAL_RouteRecord_Matchable,
  EXPERIMENTAL_RouteRecordNormalized_Matchable,
} from './router'

export { createFixedResolver } from './route-resolver/resolver-fixed'
export {
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
} from './route-resolver/matchers/matcher-pattern'

export type {
  EmptyParams,
  MatcherPattern,
  MatcherPatternHash,
  MatcherPatternPath,
  MatcherParamsFormatted,
  MatcherQueryParams,
  MatcherQueryParamsValue,
  MatcherPatternPathDynamic_ParamOptions,
} from './route-resolver/matchers/matcher-pattern'

export {
  type MatcherPatternQuery,
  MatcherPatternQueryParam,
} from './route-resolver/matchers/matcher-pattern-query'

export {
  PARAM_PARSER_INT,
  PARAM_PARSER_BOOL,
  type ParamParser,
  defineParamParser,
  definePathParamParser,
  defineQueryParamParser,
} from './route-resolver/matchers/param-parsers'

export { miss, MatchMiss as _MatchMiss } from './route-resolver/matchers/errors'

/**
 * Internal functions and types for the experimental router.
 * They should all be prefixed with `_` to avoid conflicts with the public API.
 */

// Runtime exports (definePage macro)
export {
  definePage,
  _mergeRouteRecord,
  type DefinePage,
  type ParamParserType,
  type ParamParserType_Native,
  type DefinePageQueryParamOptions,
} from './runtime'

// Data loaders exports
export {
  // Core
  DataLoaderPlugin,
  NavigationResult as _NavigationResult,
  reroute,
  useIsDataLoading,
  type DataLoaderPluginOptions,
  type SetupLoaderGuardOptions,
  // Loader types
  type UseDataLoader,
  type UseDataLoaderInternals,
  type UseDataLoaderResult,
  type DataLoaderContextBase,
  type DataLoaderEntryBase,
  type DefineDataLoaderOptionsBase_LaxData,
  type DefineDataLoaderOptionsBase_DefinedData,
  type DefineLoaderFn,
  // Utilities
  getCurrentContext,
  setCurrentContext,
  withLoaderContext,
  trackRoute,
  toLazyValue,
  // Types config
  type ErrorDefault,
} from './data-loaders/entries/index'

// TODO: only keep _NavigationResult in next major
import { NavigationResult as NavResult } from './data-loaders/entries/index'
/**
 * @deprecated Use {@link reroute} instead.
 */
export class NavigationResult extends NavResult {
  constructor(...args: ConstructorParameters<typeof NavResult>) {
    super(...args)
    console.warn(
      `[vue-router]: new NavigationResult(to) is deprecated. Use reroute(to) instead.`
    )
  }
}

// Basic loader
export {
  defineBasicLoader,
  type DefineDataLoaderOptions_LaxData,
  type DefineDataLoaderOptions_DefinedData,
  type DataLoaderContext,
  type UseDataLoaderBasic_LaxData,
  type UseDataLoaderBasic_DefinedData,
  type DataLoaderBasicEntry,
  // deprecated
  type DefineDataLoaderOptions,
  type UseDataLoaderBasic,
} from './data-loaders/defineLoader'

// FIXME: this was getting merged with non experimental code
// it should only affect when importing from experimental
// this means some interfaces import from experimental from core and they shouldn't
// we need to refactor those interface to be outside of experimental

// in the new experimental router, there are only parents
// this should create type errors if someone is relying on children
// declare module 'vue-router' {
//   export interface RouteLocationMatched {
//     /**
//      * The experimental router uses a `parent` property instead of `children`.
//      */
//     children?: never
//   }
// }
