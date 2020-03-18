import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocation,
  RouteLocationNormalizedResolved,
  NavigationGuardNextCallback,
} from '../types'

import { isRouteLocation } from '../types'
import {
  createRouterError,
  ErrorTypes,
  NavigationError,
  NavigationRedirectError,
} from '../errors'

export function guardToPromiseFn(
  guard: NavigationGuard,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedResolved
  // record?: RouteRecordNormalized
): () => Promise<void> {
  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardCallback = (
        valid?: boolean | RouteLocation | NavigationGuardNextCallback
      ) => {
        if (valid === false)
          reject(
            createRouterError<NavigationError>(ErrorTypes.NAVIGATION_ABORTED, {
              from,
              to,
            })
          )
        else if (isRouteLocation(valid)) {
          reject(
            createRouterError<NavigationRedirectError>(
              ErrorTypes.NAVIGATION_GUARD_REDIRECT,
              {
                from: to,
                to: valid,
              }
            )
          )
        } else if (!valid || valid === true) {
          resolve()
        } else {
          // TODO: call the in component enter callbacks. Maybe somewhere else
          // record && record.enterCallbacks.push(valid)
          resolve()
        }
      }

      guard(to, from, next)
    })
}
