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

export { START_LOCATION_NORMALIZED as START_LOCATION } from './location'
export type {
  // route location
  _RouteLocationBase,
  MatcherLocationAsPath,
  LocationAsRelativeRaw,
  RouteQueryAndHash,

  // route params
  RouteParamValue,
  RouteParamValueRaw,

  // Partial route location
  RouteLocationNamedRaw,
  // exported for backwards compat for old RouteLocationRaw
  RouteLocationPathRaw,
  RouteLocationMatched,

  // extra options when navigating
  RouteLocationOptions,

  // route records
  _RouteRecordBase,
  RouteRecordRaw,
  RouteRecordSingleView,
  RouteRecordSingleViewWithChildren,
  RouteRecordMultipleViews,
  RouteRecordMultipleViewsWithChildren,
  RouteRecordRedirect,
  RouteMeta,
  RouteComponent,
  // RawRouteComponent,
  RouteParamsGeneric,
  RouteParamsRawGeneric,
  MatcherLocation,
} from './types'
export type { _Awaitable } from './types/utils'

// Experimental Type Safe API
export type {
  RouteMap,
  RouteMapGeneric,

  // route location
  RouteLocationRaw,
  RouteLocation,
  RouteLocationGeneric,
  RouteLocationTyped,
  RouteLocationTypedList,

  // RouteLocationNormalized
  RouteLocationNormalizedGeneric,
  RouteLocationNormalized,
  RouteLocationNormalizedTyped,
  RouteLocationNormalizedTypedList,

  // RouteLocationNormalizedLoaded
  RouteLocationNormalizedLoadedGeneric,
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedTyped,
  RouteLocationNormalizedLoadedTypedList,

  // RouteLocationResolved
  RouteLocationResolvedGeneric,
  RouteLocationResolved,
  RouteLocationResolvedTyped,
  RouteLocationResolvedTypedList,

  // relative
  RouteLocationAsRelativeGeneric,
  RouteLocationAsRelative,
  RouteLocationAsRelativeTyped,
  RouteLocationAsRelativeTypedList,
  // string
  RouteLocationAsStringTyped,
  RouteLocationAsString,
  RouteLocationAsStringTypedList,
  // as path
  RouteLocationAsPathGeneric,
  RouteLocationAsPath,
  RouteLocationAsPathTyped,
  RouteLocationAsPathTypedList,

  // route records
  RouteRecordInfo,
  RouteRecordNameGeneric,
  RouteRecordName,
  _RouteRecordProps,
  RouteRecordRedirectOption,

  // params
  RouteParams,
  RouteParamsRaw,
  ParamValue,
  ParamValueOneOrMore,
  ParamValueZeroOrMore,
  ParamValueZeroOrOne,

  // navigation guards
  NavigationGuard,
  NavigationGuardWithThis,
  NavigationHookAfter,
  NavigationGuardReturn,
  NavigationGuardNext,
  NavigationGuardNextCallback,
} from './typed-routes'

export { createRouter } from './router'
export type { Router, RouterOptions, RouterScrollBehavior } from './router'

export { NavigationFailureType, isNavigationFailure } from './errors'
export type {
  NavigationFailure,
  ErrorTypes,
  NavigationRedirectError,
} from './errors'

export {
  onBeforeRouteLeave,
  onBeforeRouteUpdate,
  loadRouteLocation,
} from './navigationGuards'
export { RouterLink, useLink } from './RouterLink'
export type {
  _RouterLinkI,
  RouterLinkProps,
  UseLinkOptions,
  UseLinkReturn,
} from './RouterLink'
export { RouterView } from './RouterView'
export type { RouterViewProps } from './RouterView'

export type { TypesConfig } from './config'

export * from './useApi'

export * from './globalExtensions'

/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */
