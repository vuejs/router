import { inject } from 'vue'
import { routerKey, routeLocationKey } from './injectionSymbols'
import type { Router } from './router'
import type { RouteMap } from './typed-routes/route-map'
import type { RouteLocationNormalizedLoaded } from './typed-routes'

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return inject(routerKey)!
}

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute<Name extends keyof RouteMap = keyof RouteMap>(
  _name?: Name
) {
  return inject(routeLocationKey) as RouteLocationNormalizedLoaded<
    Name | RouteMap[Name]['childrenNames']
  >
}
