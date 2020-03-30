import { RouteLocationRaw } from './index'

export function isRouteLocation(route: any): route is RouteLocationRaw {
  return typeof route === 'string' || (route && typeof route === 'object')
}
