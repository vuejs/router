export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
export { createRouterMatcher } from './matcher'

export {
  LocationQuery,
  parseQuery,
  stringifyQuery,
  LocationQueryRaw,
  LocationQueryValue,
} from './query'

export { RouterHistory } from './history/common'

export { RouteRecord, RouteRecordNormalized } from './matcher/types'
export {
  PathParserOptions,
  _PathParserOptions,
} from './matcher/pathParserRanker'

export {
  RouteMeta,
  _RouteLocationBase,
  _RouteRecordBase,
  RouteLocationRaw,
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  START_LOCATION_NORMALIZED as START_LOCATION,
  RouteParams,
  RouteLocationMatched,
  RouteLocationOptions,
  RouteRecordRaw,
  NavigationGuard,
  NavigationGuardNext,
  NavigationHookAfter,
} from './types'
export {
  createRouter,
  Router,
  RouterOptions,
  ErrorHandler,
  RouterScrollBehavior,
} from './router'

export {
  NavigationFailureType,
  NavigationFailure,
  isNavigationFailure,
} from './errors'

export { onBeforeRouteLeave, onBeforeRouteUpdate } from './navigationGuards'
export { RouterLink, useLink, RouterLinkProps } from './RouterLink'
export { RouterView, RouterViewProps } from './RouterView'

export * from './useApi'

export * from './globalExtensions'

/**
 * The official Router for Vue 3.
 *
 * @packageDocumentation
 */
