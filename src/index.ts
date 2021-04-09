export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
export { createRouterMatcher } from './matcher'
export type { RouterMatcher } from './matcher'

export { parseQuery, stringifyQuery } from './query'
export type {
  LocationQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './query'

export type { RouterHistory, HistoryState } from './history/common'

export type { RouteRecord, RouteRecordNormalized } from './matcher/types'

export type {
  PathParserOptions,
  _PathParserOptions,
} from './matcher/pathParserRanker'

export {
  routeLocationKey,
  routerViewLocationKey,
  routerKey,
  matchedRouteKey,
  viewDepthKey,
} from './injectionSymbols'

export { START_LOCATION_NORMALIZED as START_LOCATION } from './types'
export type {
  // route location
  _RouteLocationBase,
  LocationAsPath,
  LocationAsRelativeRaw,
  RouteQueryAndHash,
  RouteLocationRaw,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteParams,
  RouteParamsRaw,
  RouteParamValue,
  RouteParamValueRaw,
  RouteLocationMatched,
  RouteLocationOptions,
  RouteRecordRedirectOption,
  NamedLocationMap,
  ExtractNamedRoutes,
  // route records
  _RouteRecordBase,
  RouteMeta,
  RouteComponent,
  // RawRouteComponent,
  RouteRecordName,
  RouteRecordRaw,
  NavigationGuard,
  NavigationGuardNext,
  NavigationGuardWithThis,
  NavigationHookAfter,
} from './types'
export type {
  ParamsFromPath,
  _ExtractFirstParamName,
  _RemoveRegexpFromParam,
  _RemoveUntilClosingPar,
} from './types/paths'

export { createRouter } from './router'
export type { Router, RouterOptions, RouterScrollBehavior } from './router'

export { NavigationFailureType, isNavigationFailure } from './errors'
export type { NavigationFailure } from './errors'

export {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  loadRouteLocation,
} from './navigationGuards'
export { RouterLink, useLink } from './RouterLink'
export type { RouterLinkProps, UseLinkOptions } from './RouterLink'
export { RouterView } from './RouterView'
export type { RouterViewProps } from './RouterView'

export * from './useApi'

export * from './globalExtensions'

/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */
