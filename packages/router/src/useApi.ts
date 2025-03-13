import { inject } from 'vue'
import { routerKey, routeLocationKey } from './injectionSymbols'
import { Router } from './router'
import { RouteMap, RouteNameWithChildren } from './typed-routes/route-map'
import { RouteLocationNormalizedLoaded } from './typed-routes'

/**
 * Returns the router instance. Equivalent to using `$router` inside
 * templates.
 */
export function useRouter(): Router {
  return inject(routerKey)!
}

type GetRouteLocationNormalizedLoaded<Name extends keyof RouteMap> =
  Name extends any ? RouteLocationNormalizedLoaded<Name> : never

/**
 * Returns the current route location. Equivalent to using `$route` inside
 * templates.
 */
export function useRoute<
  CurrentRouteName extends keyof RouteMap = keyof RouteMap,
>(_currentRouteName?: CurrentRouteName) {
  return inject(routeLocationKey) as GetRouteLocationNormalizedLoaded<
    RouteNameWithChildren<CurrentRouteName>
  >
}
