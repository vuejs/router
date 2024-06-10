import { RouteLocation, _RouteLocationRaw } from './route-location'

/**
 * @internal
 */
export type RouteRecordRedirectOption =
  | _RouteLocationRaw
  | ((to: RouteLocation) => _RouteLocationRaw)
