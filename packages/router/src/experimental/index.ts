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

export { createStaticResolver } from './route-resolver/resolver-static'
export type {
  MatcherQueryParams,
  MatcherQueryParamsValue,
} from './route-resolver/resolver-abstract'
export {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
  MatcherPatternPathStar,
  MatcherPatternPathCustomParams,
  // native param parsers
  PARAM_PARSER_INT,
} from './route-resolver/matchers/matcher-pattern'
export type {
  MatcherPattern,
  MatcherPatternHash,
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherParamsFormatted,
  EmptyParams,
  ParamParser,
} from './route-resolver/matchers/matcher-pattern'

import type { RouteRecordNormalized } from '../matcher/types'

// in the new experimental router, there are only parents
// this should create type errors if someone is realying on children
declare module 'vue-router' {
  export interface RouteLocationMatched {
    children?: RouteRecordNormalized['children']
  }
}
