import { RouteRecordMultipleViews, NavigationGuard } from '../types'

export interface RouteRecordNormalizedCommon {
  leaveGuards: NavigationGuard[]
}

// normalize component/components into components
export type RouteRecordNormalized = RouteRecordNormalizedCommon &
  // TODO: make it required (monomorphic)
  Pick<
    RouteRecordMultipleViews,
    'path' | 'name' | 'components' | 'children' | 'meta' | 'beforeEnter'
  >
