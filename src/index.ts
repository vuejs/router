import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'

export {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
  // needed for types, should probably be removed by changing the
  RouteLocationOptions,
} from './types'
export { createRouter, Router } from './router'

export { onBeforeRouteLeave } from './navigationGuards'
export { useRoute, useRouter } from './injectKeys'
export { Link } from './components/Link'
export { View } from './components/View'

export { createHistory, createMemoryHistory, createHashHistory }
