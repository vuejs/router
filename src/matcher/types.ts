import {
  RouteParams,
  RouteRecordMultipleViews,
  RouteRecordRedirect,
} from '../types'

// normalize component/components into components
export type NormalizedRouteRecord =
  | Omit<RouteRecordRedirect, 'alias'>
  | Omit<RouteRecordMultipleViews, 'alias'>

export interface RouteRecordMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: NormalizedRouteRecord
  parent: RouteRecordMatcher | void
  // TODO: children so they can be removed
  // children: RouteMatcher[]
  // TODO: needs information like optional, repeatable
  keys: string[]
  score: number
}
