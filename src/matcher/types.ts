import { RouteRecordMultipleViews, NavigationGuard } from '../types'

// normalize component/components into components and make every property always present
export interface RouteRecordNormalized {
  path: RouteRecordMultipleViews['path']
  name: RouteRecordMultipleViews['name']
  components: RouteRecordMultipleViews['components']
  children: RouteRecordMultipleViews['children']
  meta: Exclude<RouteRecordMultipleViews['meta'], void>
  beforeEnter: RouteRecordMultipleViews['beforeEnter']
  leaveGuards: NavigationGuard[]
}
