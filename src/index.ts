import { createRouter, Router } from './router'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
import { onBeforeRouteLeave } from './navigationGuards'

export { RouteLocationOptions } from './types'

export { useRoute, useRouter } from './injectKeys'

export {
  createHistory,
  createMemoryHistory,
  createHashHistory,
  createRouter,
  RouteLocationNormalized,
  Router,
  START_LOCATION,
  onBeforeRouteLeave,
}
