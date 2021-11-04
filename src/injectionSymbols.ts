import { InjectionKey, ComputedRef, Ref } from 'vue'
import { RouteLocationNormalizedLoaded } from './types'
import { Router } from './router'
import { RouteRecordNormalized } from './matcher/types'

export const hasSymbol =
  typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol'

export const PolySymbol = (name: string) =>
  // vr = vue router
  hasSymbol
    ? Symbol(__DEV__ ? '[vue-router]: ' + name : name)
    : (__DEV__ ? '[vue-router]: ' : '_vr_') + name

// rvlm = Router View Location Matched
/**
 * RouteRecord being rendered by the closest ancestor Router View. Used for
 * `onBeforeRouteUpdate` and `onBeforeRouteLeave`. rvlm stands for Router View
 * Location Matched
 *
 * @internal
 */
export const matchedRouteKey = /*#__PURE__*/ PolySymbol(
  __DEV__ ? 'router view location matched' : 'rvlm'
) as InjectionKey<ComputedRef<RouteRecordNormalized | undefined>>

/**
 * Allows overriding the router view depth to control which component in
 * `matched` is rendered. rvd stands for Router View Depth
 *
 * @internal
 */
export const viewDepthKey = /*#__PURE__*/ PolySymbol(
  __DEV__ ? 'router view depth' : 'rvd'
) as InjectionKey<Ref<number> | number>

/**
 * Allows overriding the router instance returned by `useRouter` in tests. r
 * stands for router
 *
 * @internal
 */
export const routerKey = /*#__PURE__*/ PolySymbol(
  __DEV__ ? 'router' : 'r'
) as InjectionKey<Router>

/**
 * Allows overriding the current route returned by `useRoute` in tests. rl
 * stands for route location
 *
 * @internal
 */
export const routeLocationKey = /*#__PURE__*/ PolySymbol(
  __DEV__ ? 'route location' : 'rl'
) as InjectionKey<RouteLocationNormalizedLoaded>

/**
 * Allows overriding the current route used by router-view. Internally this is
 * used when the `route` prop is passed.
 *
 * @internal
 */
export const routerViewLocationKey = /*#__PURE__*/ PolySymbol(
  __DEV__ ? 'router view location' : 'rvl'
) as InjectionKey<Ref<RouteLocationNormalizedLoaded>>
