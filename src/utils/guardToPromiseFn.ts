import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocation,
} from '../types'

import { isRouteLocation } from '../types'
import { createRouterError, ErrorTypes } from '../errors-new'

export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): () => Promise<void> {
  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardCallback = (
        valid?: boolean | RouteLocation
      ) => {
        // TODO: handle callback
        if (valid === false)
          reject(createRouterError(ErrorTypes.NAVIGATION_ABORTED, from, to))
        else if (isRouteLocation(valid)) {
          reject(
            createRouterError(ErrorTypes.NAVIGATION_GUARD_REDIRECT, to, valid)
          )
        } else resolve()
      }

      guard(to, from, next)
    })
}
