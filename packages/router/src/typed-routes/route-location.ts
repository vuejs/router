import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationOptions,
  RouteQueryAndHash,
  RouteRecordName,
  RouteLocationRaw,
} from '../types'
import type { _LiteralUnion } from '../types/utils'
// inlining the type as it avoids code splitting issues
import type { RouteMap, _RouteMapGeneric } from './route-map'
import type { Router } from '../router'

/**
 * Type safe version if it exists of the routes' names.
 */
export type _RouteRecordName = keyof RouteMap

/**
 * Type safe version of the {@link RouteLocation} type.
 * @internal
 */
export interface RouteLocationTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocation {
  name: Extract<Name, RouteRecordName>
  params: RouteMap[Name]['params']
}

/**
 * Type safe version of the {@link RouteLocation} type as a Record with all the routes.
 * @internal
 */
export type RouteLocationTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationTyped<RouteMap, N> }

/**
 * Helper to generate a type safe version of the `RouteLocationNormalized` type.
 * @internal
 */
export interface RouteLocationNormalizedTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalized {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

/**
 * Helper to generate a type safe version of the `RouteLocationNormalizedLoaded` type.
 * @internal
 */
export type RouteLocationNormalizedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationNormalizedTyped<RouteMap, N> }

/**
 * Helper to generate a type safe version of the `RouteLocationNormalizedLoaded` type.
 * @internal
 */
export interface RouteLocationNormalizedLoadedTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteLocationNormalizedLoaded {
  name: Extract<Name, RouteRecordName>
  // we don't override path because it could contain params and in practice it's just not useful
  params: RouteMap[Name]['params']
}

/**
 * Helper to generate a type safe version of the {@link RouteLocationNormalizedLoaded } type.
 * @internal
 */
export type RouteLocationNormalizedLoadedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationNormalizedLoadedTyped<RouteMap, N> }

/**
 * Type safe adaptation of {@link LocationAsRelativeRaw}. Used to generate the union of all possible location.
 * @internal
 */
export interface RouteLocationAsRelativeTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  name?: Name
  params?: RouteMap[Name]['paramsRaw']

  // A relative path shouldn't have a path. This is easier to check with TS
  path?: undefined
}

/**
 * Type safe adaptation of {@link LocationAsRelativeRaw}. Used to generate the union of all possible location.
 * @internal
 */
export type RouteLocationAsRelativeTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationAsRelativeTyped<RouteMap, N> }

/**
 * Type safe version to auto complete the path of a route.
 * @internal
 */
export interface RouteLocationAsPathTyped<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric,
  Name extends keyof RouteMap = keyof RouteMap
> extends RouteQueryAndHash,
    RouteLocationOptions {
  path: _LiteralUnion<RouteMap[Name]['path']>

  // // allows to check for .path and other properties that exist in different route location types
  // [key: string]: unknown
}

/**
 * Type safe version to auto complete the path of a route.
 * @internal
 */
export type RouteLocationAsPathTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationAsPathTyped<RouteMap, N> }

/**
 * Same as {@link RouteLocationAsPathTyped} but as a string literal.
 * @internal
 */
export type RouteLocationAsString<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = _LiteralUnion<RouteMap[keyof RouteMap]['path'], string>

/**
 * Type safe version of a resolved route location returned by `router.resolve()`.
 * @see {@link RouteLocationTyped}
 * @internal
 */
export interface RouteLocationResolvedTyped<
  RouteMap extends _RouteMapGeneric,
  Name extends keyof RouteMap
> extends RouteLocationTyped<RouteMap, Name> {
  href: string
}

/**
 * Record of all the resolved routes.
 * @see {@link RouteLocationResolvedTyped}
 * @internal
 */
export type RouteLocationResolvedTypedList<
  RouteMap extends _RouteMapGeneric = _RouteMapGeneric
> = { [N in keyof RouteMap]: RouteLocationResolvedTyped<RouteMap, N> }

/**
 * Type safe versions of types that are exposed by vue-router
 */

/**
 * Type safe version of `RouteLocationNormalized`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationNormalized}
 */
export type _RouteLocationNormalized<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationNormalizedTypedList<RouteMap>[Name]

/**
 * Type safe version of `RouteLocationNormalizedLoaded`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationNormalizedLoaded}
 */
export type _RouteLocationNormalizedLoaded<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationNormalizedLoadedTypedList<RouteMap>[Name]

/**
 * Type safe version of `RouteLocationAsRelative`. Accepts the name of the route as a type parameter.
 * @see {@link RouteLocationAsRelative}
 */
export type _RouteLocationAsRelativePath<
  Name extends _RouteRecordName = _RouteRecordName
> = RouteLocationAsRelativeTypedList<RouteMap>[Name]

/**
 * Type safe version of `RouteLocationResolved` (the returned route of `router.resolve()`).
 * Allows passing the name of the route to be passed as a generic.
 * @see {@link Router['resolve']}
 */
export type _RouteLocationResolved<
  Name extends keyof RouteMap = keyof RouteMap
> = RouteLocationResolvedTypedList<RouteMap>[Name]

/**
 * Type safe version of `RouteLocation` . Allows passing the name of the route to be passed as a generic.
 * @see {@link RouteLocation}
 */
export type _RouteLocation<Name extends keyof RouteMap = keyof RouteMap> =
  RouteLocationTypedList<RouteMap>[Name]

/**
 * Type safe version of {@link `RouteLocationRaw`} . Allows passing the name of the route to be passed as a generic.
 * @see {@link RouteLocationRaw}
 */
export type _RouteLocationRaw<Name extends keyof RouteMap = keyof RouteMap> =
  | RouteLocationAsString<RouteMap>
  | RouteLocationAsRelativeTypedList<RouteMap>[Name]
  | RouteLocationAsPathTypedList<RouteMap>[Name]

/**
 * Generate a type safe params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParams}
 */
export type _RouteParams<Name extends keyof RouteMap = keyof RouteMap> =
  RouteMap[Name]['params']

/**
 * Generate a type safe raw params for a route location. Requires the name of the route to be passed as a generic.
 * @see {@link RouteParamsRaw}
 */
export type _RouteParamsRaw<Name extends keyof RouteMap = keyof RouteMap> =
  RouteMap[Name]['paramsRaw']
