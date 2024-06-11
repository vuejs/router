import type { RouteLocationRaw, RouteRecordName } from '../typed-routes'

export function isRouteLocation(route: any): route is RouteLocationRaw {
  return typeof route === 'string' || (route && typeof route === 'object')
}

export function isRouteName(name: any): name is RouteRecordName {
  return typeof name === 'string' || typeof name === 'symbol'
}
