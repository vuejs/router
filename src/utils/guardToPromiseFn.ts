import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocation,
} from '../types'

import { isRouteLocation } from './index'
import { RedirectError } from '../errors'

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
        // TODO: better error
        // TODO: handle callback
        if (valid === false) reject(new Error('Aborted'))
        else if (isRouteLocation(valid)) {
          // TODO: redirect
          reject(new RedirectError(to, valid))
        } else resolve()
      }

      guard(to, from, next)
    })
}
