import type { InjectionKey, ComputedRef, Ref } from 'vue'
import { RouteLocationNormalizedLoaded } from './types'
import { RouteRecordNormalized } from './matcher/types'
import type { Router } from './router'

/**
 * RouteRecord being rendered by the closest ancestor Router View. Used for
 * `onBeforeRouteUpdate` and `onBeforeRouteLeave`. rvlm stands for Router View
 * Location Matched
 *
 * @internal
 */
export const matchedRouteKey = Symbol(
  __DEV__ ? 'router view location matched' : ''
) as InjectionKey<ComputedRef<RouteRecordNormalized | undefined>>

/**
 * Allows overriding the router view depth to control which component in
 * `matched` is rendered. rvd stands for Router View Depth
 *
 * @internal
 */
export const viewDepthKey = Symbol(
  __DEV__ ? 'router view depth' : ''
) as InjectionKey<Ref<number> | number>

/**
 * Allows overriding the router instance returned by `useRouter` in tests. r
 * stands for router
 *
 * @internal
 */
export const routerKey = Symbol(__DEV__ ? 'router' : '') as InjectionKey<Router>

/**
 * Allows overriding the current route returned by `useRoute` in tests. rl
 * stands for route location
 *
 * @internal
 */
export const routeLocationKey = Symbol(
  __DEV__ ? 'route location' : ''
) as InjectionKey<RouteLocationNormalizedLoaded>

/**
 * Allows overriding the current route used by router-view. Internally this is
 * used when the `route` prop is passed.
 *
 * @internal
 */
export const routerViewLocationKey = Symbol(
  __DEV__ ? 'router view location' : ''
) as InjectionKey<Ref<RouteLocationNormalizedLoaded>>
