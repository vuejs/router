import createWebHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createWebHashHistory from './history/hash'
import { inject } from 'vue'
import { routerKey, routeLocationKey } from './utils/injectionSymbols'

export { LocationQuery, parseQuery, stringifyQuery } from './utils/query'

export { RouterHistory } from './history/common'

export { RouteRecordNormalized } from './matcher/types'

export {
  RouteLocationNormalized,
  RouteLocationNormalizedResolved,
  START_LOCATION_NORMALIZED as START_LOCATION,
  RouteParams,
  RouteLocationOptions,
  RouteRecord,
  NavigationGuard,
  PostNavigationGuard,
} from './types'
export { createRouter, Router, RouterOptions, ErrorHandler } from './router'

export { onBeforeRouteLeave } from './navigationGuards'
export { Link, useLink } from './components/Link'
export { View, useView } from './components/View'

export { createWebHistory, createMemoryHistory, createWebHashHistory }

export function useRouter() {
  return inject(routerKey)!
}

export function useRoute() {
  return inject(routeLocationKey)!
}
