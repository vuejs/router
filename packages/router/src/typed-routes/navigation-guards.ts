import type { _Awaitable } from '../types/utils'
import type { NavigationGuardNext } from '../types'
import type {
  _RouteLocationNormalizedLoaded,
  RouteLocationNormalizedTypedList,
  RouteLocationNormalizedLoadedTypedList,
  RouteLocationAsString,
  RouteLocationAsRelativeTypedList,
  RouteLocationAsPathTypedList,
  _RouteLocationNormalized,
} from './route-location'
import type { _RouteMapGeneric, RouteMap } from './route-map'
import type { NavigationFailure } from '../errors'

/**
 * Return types for a Navigation Guard. Accepts a type param for the RouteMap.
 */
type NavigationGuardReturnTyped<RouteMap extends _RouteMapGeneric> =
  | void
  | Error
  | boolean
  | RouteLocationAsString<RouteMap>
  | RouteLocationAsRelativeTypedList<RouteMap>[keyof RouteMap]
  | RouteLocationAsPathTypedList<RouteMap>[keyof RouteMap]

/**
 * Return types for a Navigation Guard. Based on `TypesConfig`
 *
 * @see {@link TypesConfig}
 * @see {@link NavigationGuardReturnTyped}
 */
export type NavigationGuardReturn = NavigationGuardReturnTyped<RouteMap>

/**
 * Typed Navigation Guard with a type parameter for `this` and another for the route map.
 */
export interface NavigationGuardWithThisTyped<
  T,
  RouteMap extends _RouteMapGeneric
> {
  (
    this: T,
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturnTyped<RouteMap>>
}

/**
 * Typed Navigation Guard with a type parameter for `this`. Based on `TypesConfig`
 * @see {@link TypesConfig}
 * @see {@link NavigationGuardWithThisTyped}
 */
export interface NavigationGuardWithThis<T>
  extends NavigationGuardWithThisTyped<T, RouteMap> {}

/**
 * In `router.beforeResolve((to) => {})`, the `to` is typed as `RouteLocationNormalizedLoaded`, not
 * `RouteLocationNormalized` like in `router.beforeEach()`. In practice it doesn't change much as users do not rely on
 * the difference between them but if we update the type in vue-router, we will have to update this type too.
 * @internal
 */
export interface _NavigationGuardResolved {
  (
    this: undefined,
    to: _RouteLocationNormalizedLoaded,
    from: _RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturn>
}

/**
 * Typed Navigation Guard. Accepts a type param for the RouteMap.
 */
export interface NavigationGuardTyped<RouteMap extends _RouteMapGeneric> {
  (
    to: _RouteLocationNormalized,
    from: _RouteLocationNormalizedLoaded,
    // intentionally not typed to make people use the return
    next: NavigationGuardNext
  ): _Awaitable<NavigationGuardReturnTyped<RouteMap>>
}

/**
 * Typed Navigation Guard. Based on `TypesConfig`.
 * @see {@link TypesConfig}
 * @see {@link NavigationGuardWithThisTyped}
 */
export type NavigationGuard = NavigationGuardTyped<RouteMap>

/**
 * Typed Navigation Hook After. Accepts a type param for the RouteMap.
 */
export interface NavigationHookAfterTyped<RouteMap extends _RouteMapGeneric> {
  (
    to: RouteLocationNormalizedTypedList<RouteMap>[keyof RouteMap],
    from: RouteLocationNormalizedLoadedTypedList<RouteMap>[keyof RouteMap],
    failure?: NavigationFailure | void
  ): unknown
}

/**
 * Typed Navigation Hook After. Based on `TypesConfig`.
 * @see {@link TypesConfig}
 * @see {@link NavigationHookAfterTyped}
 */
export interface NavigationHookAfter
  extends NavigationHookAfterTyped<RouteMap> {}
