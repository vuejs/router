import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './route-location'
import type { RouteMap, RouteMapGeneric } from './route-map'

/**
 * @internal
 */
export type RouteRecordRedirectOption =
  | RouteLocationRaw
  | ((to: RouteLocation) => RouteLocationRaw)

/**
 * Possible values for a route record **after normalization**
 */
export type RouteRecordNameGeneric = string | symbol | undefined

/**
 * Possible values for a user-defined route record's name.
 *
 * NOTE: since `RouteRecordName` is a type, it evaluates too early and it's always be {@link RouteRecordNameGeneric}. If you need a typed version use {@link RouteMap | `keyof RouteMap`}
 */
export type RouteRecordName = RouteMapGeneric extends RouteMap
  ? RouteRecordNameGeneric
  : keyof RouteMap

/**
 * @internal
 */
export type _RouteRecordProps<Name extends keyof RouteMap = keyof RouteMap> =
  | boolean
  | Record<string, any>
  | ((to: RouteLocationNormalized<Name>) => Record<string, any>)
