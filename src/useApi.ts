import { inject } from 'vue'
import { routerKey, routeLocationKey } from './injectionSymbols'
import { RouterTyped } from './typedRouter'
import { RouteLocationNormalizedLoaded } from './types'

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): RouterTyped {
  return inject(routerKey)!
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  return inject(routeLocationKey)!
}
