import createWebHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createWebHashHistory from './history/hash'
import { inject } from 'vue'
import { routerKey, routeLocationKey } from './utils/injectionSymbols'

export { RouterHistory } from './history/common'

export {
  RouteLocationNormalized,
  RouteLocationOptions,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
export { createRouter, Router, RouterOptions } from './router'

export { onBeforeRouteLeave } from './navigationGuards'
export { Link } from './components/Link'
export { View } from './components/View'

export { createWebHistory, createMemoryHistory, createWebHashHistory }

export function useRouter() {
  return inject(routerKey)!
}

export function useRoute() {
  return inject(routeLocationKey)!
}
