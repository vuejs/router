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
  instances: Record<string, ComponentPublicInstance | undefined | null>
  // can only be of of the same type as this record
  aliasOf: RouteRecordNormalized | undefined
}

export type RouteRecord = RouteRecordNormalized
