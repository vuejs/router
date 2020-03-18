import createWebHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createWebHashHistory from './history/hash'

export {
  RouteLocationNormalized,
  RouteLocationOptions,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
export { createRouter, Router, RouterOptions } from './router'

export { onBeforeRouteLeave } from './navigationGuards'
export { useRoute, useRouter } from './injectKeys'
export { Link } from './components/Link'
export { View } from './components/View'

export { createWebHistory, createMemoryHistory, createWebHashHistory }
