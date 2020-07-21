import {
  RouteRecordMultipleViews,
  NavigationGuard,
  _RouteRecordBase,
  _RouteRecordProps,
  NavigationGuardNextCallback,
} from '../types'
import { ComponentPublicInstance } from 'vue'

// normalize component/components into components and make every property always present
export interface RouteRecordNormalized {
  path: RouteRecordMultipleViews['path']
  redirect: _RouteRecordBase['redirect'] | undefined
  name: RouteRecordMultipleViews['name']
  components: RouteRecordMultipleViews['components']
  children: Exclude<RouteRecordMultipleViews['children'], void>
  meta: Exclude<RouteRecordMultipleViews['meta'], void>
  /**
   * Object of props options with the same keys as `components`
   */
  props: Record<string, _RouteRecordProps>
  beforeEnter: RouteRecordMultipleViews['beforeEnter']
  leaveGuards: NavigationGuard[]
  updateGuards: NavigationGuard[]
  enterCallbacks: NavigationGuardNextCallback[]
  // having the instances on the record mean beforeRouteUpdate and
  // beforeRouteLeave guards can only be invoked with the latest mounted app
  // instance if there are multiple application instances rendering the same
  // view, basically duplicating the content on the page, which shouldn't happen
  // in practice. It will work if multiple apps are rendering different named
  // views.
  instances: Record<string, ComponentPublicInstance | undefined | null>
  // can only be of of the same type as this record
  aliasOf: RouteRecordNormalized | undefined
}

export type RouteRecord = RouteRecordNormalized
