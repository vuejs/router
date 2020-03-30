import {
  NavigationGuard,
  RouteLocationNormalized,
  NavigationGuardCallback,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
  NavigationGuardNextCallback,
  isRouteLocation,
} from '../types'

import {
  createRouterError,
  ErrorTypes,
  NavigationError,
  NavigationRedirectError,
} from '../errors'
import { ComponentPublicInstance } from 'vue'

export function guardToPromiseFn(
  guard: NavigationGuard<undefined>,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  instance?: undefined
): () => Promise<void>
export function guardToPromiseFn<
  ThisType extends ComponentPublicInstance | undefined
>(
  guard: NavigationGuard<ThisType>,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  instance: ThisType
): () => Promise<void> {
  return () =>
    new Promise((resolve, reject) => {
      const next: NavigationGuardCallback = (
        valid?: boolean | RouteLocationRaw | NavigationGuardNextCallback
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

      guard.call(instance, to, from, next)
    })
}
