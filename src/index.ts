import createWebHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createWebHashHistory from './history/hash'

export {
  LocationQuery,
  parseQuery,
  stringifyQuery,
  LocationQueryRaw,
  LocationQueryValue,
} from './utils/query'

export { RouterHistory } from './history/common'

export { RouteRecord, RouteRecordNormalized } from './matcher/types'

export {
  RouteLocationRaw,
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

export { onBeforeRouteLeave } from './navigationGuards'
export { Link, useLink } from './components/Link'
export { View } from './components/View'

export { createWebHistory, createMemoryHistory, createWebHashHistory }

export * from './useApi'
