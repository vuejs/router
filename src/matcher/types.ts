import { RouteRecordMultipleViews, NavigationGuard } from '../types'

export interface RouteRecordNormalizedCommon {
  leaveGuards: NavigationGuard[]
}

// TODO: rename or refactor the duplicated type
// normalize component/components into components
export type RouteRecordNormalized = RouteRecordNormalizedCommon &
  Pick<
    RouteRecordMultipleViews,
    'path' | 'name' | 'components' | 'children' | 'meta' | 'beforeEnter'
  >

// When Matching a location, only RouteRecordView is possible, because redirections never end up in `matched`
export type RouteRecordMatched = RouteRecordNormalized
