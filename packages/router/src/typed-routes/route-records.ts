import type {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './route-location'
import type { RouteMap } from './route-map'

/**
 * @internal
 */
export type RouteRecordRedirectOption =
  | RouteLocationRaw
  | ((to: RouteLocation) => RouteLocationRaw)

/**
 * Possible values for a route record **after normalization**
 *
 * NOTE: since `RouteRecordName` is a type, it evaluates too early and it's always be a generic version. If you need a typed version of all of the names of routes, use {@link RouteMap | `keyof RouteMap`}
 */
export type RouteRecordName = string | symbol | undefined

/**
 * @internal
 */
export type _RouteRecordProps<Name extends keyof RouteMap = keyof RouteMap> =
  | boolean
  | Record<string, any>
  | ((to: RouteLocationNormalized<Name>) => Record<string, any>)
