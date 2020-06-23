export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'

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
  PostNavigationGuard,
} from './types'
export {
  createRouter,
  Router,
  RouterOptions,
  ErrorHandler,
  ScrollBehavior,
} from './router'

export { NavigationFailureType, NavigationFailure } from './errors'

export { onBeforeRouteLeave, onBeforeRouteUpdate } from './navigationGuards'
export { RouterLink, useLink, RouterLinkProps } from './RouterLink'
export { RouterView, RouterViewProps } from './RouterView'

export * from './useApi'
