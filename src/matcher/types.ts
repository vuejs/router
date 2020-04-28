import {
  RouteRecordMultipleViews,
  NavigationGuard,
  _RouteRecordBase,
  RouteRecordRedirectRaw,
} from '../types'
import { ComponentPublicInstance } from 'vue'

// normalize component/components into components and make every property always present
export interface RouteRecordNormalized {
  path: RouteRecordMultipleViews['path']
  name: RouteRecordMultipleViews['name']
  components: RouteRecordMultipleViews['components']
  children: Exclude<RouteRecordMultipleViews['children'], void>
  meta: Exclude<RouteRecordMultipleViews['meta'], void>
  props: Exclude<_RouteRecordBase['props'], void>
  beforeEnter: RouteRecordMultipleViews['beforeEnter']
  leaveGuards: NavigationGuard[]
  updateGuards: NavigationGuard[]
  instances: Record<string, ComponentPublicInstance | undefined | null>
  // can only be of of the same type as this record
  aliasOf: RouteRecordNormalized | undefined
}

export interface RouteRecordRedirect {
  path: RouteRecordMultipleViews['path']
  name: RouteRecordMultipleViews['name']
  redirect: RouteRecordRedirectRaw['redirect']
  // can only be of of the same type as this record
  aliasOf: RouteRecordRedirect | undefined
  meta: Exclude<RouteRecordMultipleViews['meta'], void>
  // this object will always be empty but it simplifies things
  components: RouteRecordMultipleViews['components']
}

export type RouteRecord = RouteRecordNormalized | RouteRecordRedirect
