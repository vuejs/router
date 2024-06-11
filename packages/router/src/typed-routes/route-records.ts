import {
  RouteLocation,
  RouteLocationNormalized,
  RouteLocationRaw,
} from './route-location'
import { RouteMap } from './route-map'

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
 * @internal
 */
export type _RouteRecordProps<Name extends keyof RouteMap = keyof RouteMap> =
  | boolean
  | Record<string, any>
  | ((to: RouteLocationNormalized<Name>) => Record<string, any>)
