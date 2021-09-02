import { inject } from 'vue'
import { warnDuplicatePackage } from './warnDuplicatePackage'
import { routerKey, routeLocationKey } from './injectionSymbols'
import { Router } from './router'
import { RouteLocationNormalizedLoaded } from './types'

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  __DEV__ && warnDuplicatePackage()

  return inject(routerKey)!
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute(): RouteLocationNormalizedLoaded {
  __DEV__ && warnDuplicatePackage()

  return inject(routeLocationKey)!
}
