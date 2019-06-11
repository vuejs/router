import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocation,
} from '../types'

import { isRouteLocation } from './index'
import { NavigationGuardRedirect, NavigationAborted } from '../errors'

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
        if (valid === false) reject(new NavigationAborted(to, from))
        else if (isRouteLocation(valid)) {
          reject(new NavigationGuardRedirect(to, valid))
        } else resolve()
      }

      guard(to, from, next)
    })
}
