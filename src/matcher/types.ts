import {
  RouteParams,
  RouteRecordMultipleViews,
  RouteRecordRedirect,
} from '../types'

interface RouteRecordRedirectNormalized {
  path: RouteRecordRedirect['path']
  name: RouteRecordRedirect['name']
  redirect: RouteRecordRedirect['redirect']
  meta: RouteRecordRedirect['meta']
  beforeEnter: RouteRecordRedirect['beforeEnter']
}
interface RouteRecordViewNormalized {
  path: RouteRecordMultipleViews['path']
  name: RouteRecordMultipleViews['name']
  components: RouteRecordMultipleViews['components']
  children: RouteRecordMultipleViews['children']
  meta: RouteRecordMultipleViews['meta']
  beforeEnter: RouteRecordMultipleViews['beforeEnter']
}
// normalize component/components into components
export type RouteRecordNormalized =
  | RouteRecordRedirectNormalized
  | RouteRecordViewNormalized

// TODO: move to a different file
export interface RouteRecordMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: RouteRecordNormalized
  parent: RouteRecordMatcher | undefined
  // TODO: children so they can be removed
  // children: RouteMatcher[]
  // TODO: needs information like optional, repeatable
  keys: string[]
  score: number
}
