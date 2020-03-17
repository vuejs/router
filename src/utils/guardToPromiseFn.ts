import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocation,
  RouteLocationNormalizedResolved,
  NavigationGuardNextCallback,
} from '../types'

import { isRouteLocation } from '../types'
import { NavigationGuardRedirect, NavigationAborted } from '../errors'

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
        if (valid === false) reject(new NavigationAborted(to, from))
        else if (isRouteLocation(valid)) {
          reject(new NavigationGuardRedirect(to, valid))
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
