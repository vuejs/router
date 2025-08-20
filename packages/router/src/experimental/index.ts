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
  type ParamParser,
  defineParamParser,
} from './route-resolver/matchers/param-parsers'

export { miss, MatchMiss } from './route-resolver/matchers/errors'

/**
 * Internal functions and types for the experimental router.
 * They should all be prefixed with `_` to avoid conflicts with the public API.
 */

export { mergeRouteRecord as _mergeRouteRecord } from './router'

// in the new experimental router, there are only parents
// this should create type errors if someone is realying on children
declare module 'vue-router' {
  export interface RouteLocationMatched {
    /**
     * The experimental router uses a `parent` property instead of `children`.
     */
    children?: never
  }
}
