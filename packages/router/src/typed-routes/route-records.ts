import { _RouteLocation, _RouteLocationRaw } from './route-location'

/**
 * @internal
 */
export type RouteRecordRedirectOption =
  | _RouteLocationRaw
  | ((to: _RouteLocation) => _RouteLocationRaw)
