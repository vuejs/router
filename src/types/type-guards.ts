import { RouteLocation } from './index'

export function isRouteLocation(route: any): route is RouteLocation {
  return typeof route === 'string' || (route && typeof route === 'object')
}
