export {
  LocationQuery,
  parseQuery,
  stringifyQuery,
  LocationQueryRaw,
  LocationQueryValue,
} from './query'

export { RouterHistory } from './history/common'
export { createWebHashHistory } from './history/hash'
export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'

export { RouteRecord, RouteRecordNormalized } from './matcher/types'

export {
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
export { RouterLink, useLink } from './RouterLink'
export { RouterView } from './RouterView'

export * from './useApi'
