export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
export { createRouterMatcher, RouterMatcher } from './matcher'

export {
  LocationQuery,
  parseQuery,
  stringifyQuery,
  LocationQueryRaw,
  LocationQueryValue,
  LocationQueryValueRaw,
} from './query'

export { RouterHistory, HistoryState } from './history/common'

export { RouteRecord, RouteRecordNormalized } from './matcher/types'

export {
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

export {
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
  // route records
  _RouteRecordBase,
  RouteMeta,
  START_LOCATION_NORMALIZED as START_LOCATION,
  RouteComponent,
  // RawRouteComponent,
  RouteRecordName,
  RouteRecordRaw,
  NavigationGuard,
  NavigationGuardNext,
  NavigationGuardWithThis,
  NavigationHookAfter,
} from './types'

export {
  createRouter,
  Router,
  RouterOptions,
  RouterScrollBehavior,
} from './router'

export {
  NavigationFailureType,
  NavigationFailure,
  isNavigationFailure,
} from './errors'

export { onBeforeRouteLeave, onBeforeRouteUpdate } from './navigationGuards'
export {
  RouterLink,
  useLink,
  RouterLinkProps,
  UseLinkOptions,
} from './RouterLink'
export { RouterView, RouterViewProps } from './RouterView'
export {
  RouterViewSuspended,
  RouterViewSuspendedProps,
} from './RouterViewSuspended'

export * from './useApi'

export * from './globalExtensions'

/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */
