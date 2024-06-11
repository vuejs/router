import type { _Awaitable } from '../types/utils'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './route-location'
import type { TypesConfig } from '../config'
import type { NavigationFailure } from '../errors'
import { ComponentPublicInstance } from 'vue'

/**
 * Return types for a Navigation Guard. Based on `TypesConfig`
 *
 * @see {@link TypesConfig}
 */
export type NavigationGuardReturn = void | Error | boolean | RouteLocationRaw

/**
 * Navigation Guard with a type parameter for `this`.
 * @see {@link TypesConfig}
 */
export interface NavigationGuardWithThis<T> {
  (
    this: T,
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturn>
}

/**
 * In `router.beforeResolve((to) => {})`, the `to` is typed as `RouteLocationNormalizedLoaded`, not
 * `RouteLocationNormalized` like in `router.beforeEach()`. In practice it doesn't change much as users do not rely on
 * the difference between them but if we update the type in vue-router, we will have to update this type too.
 * @internal
 */
export interface _NavigationGuardResolved {
  (
    this: undefined,
    to: RouteLocationNormalizedLoaded,
    from: RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturn>
}

/**
 * Navigation Guard.
 */
export interface NavigationGuard {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturn>
}

/**
 * Navigation hook triggered after a navigation is settled.
 */
export interface NavigationHookAfter {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    failure?: NavigationFailure | void
  ): unknown
}

/**
 * `next()` callback passed to navigation guards.
 */
export interface NavigationGuardNext {
  (): void
  (error: Error): void
  (location: RouteLocationRaw): void
  (valid: boolean | undefined): void
  (cb: NavigationGuardNextCallback): void
  /**
   * Allows to detect if `next` isn't called in a resolved guard. Used
   * internally in DEV mode to emit a warning. Commented out to simplify
   * typings.
   * @internal
   */
  // _called: boolean
}

/**
 * Callback that can be passed to `next()` in `beforeRouteEnter()` guards.
 */
export type NavigationGuardNextCallback = (
  vm: ComponentPublicInstance
) => unknown
