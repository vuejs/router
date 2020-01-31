import {
  RouteRecordMultipleViews,
  RouteRecordRedirect,
  NavigationGuard,
} from '../types'

export interface RouteRecordNormalizedCommon {
  leaveGuards: NavigationGuard[]
}

type RouteRecordRedirectNormalized = RouteRecordNormalizedCommon &
  Pick<
    RouteRecordRedirect,
    'path' | 'name' | 'redirect' | 'beforeEnter' | 'meta'
  >

type RouteRecordViewNormalized = RouteRecordNormalizedCommon &
  Pick<
    RouteRecordMultipleViews,
    'path' | 'name' | 'components' | 'children' | 'meta' | 'beforeEnter'
  >

// normalize component/components into components
// How are RouteRecords stored in a matcher
export type RouteRecordNormalized =
  | RouteRecordRedirectNormalized
  | RouteRecordViewNormalized

// When Matching a location, only RouteRecordView is possible, because redirections never end up in `matched`
export type RouteRecordMatched = RouteRecordViewNormalized
