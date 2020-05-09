import { InjectionKey, ComputedRef } from 'vue'
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
export const matchedRouteKey = PolySymbol(
  __DEV__ ? 'router view location matched' : 'rvlm'
) as InjectionKey<ComputedRef<RouteRecordNormalized | undefined>>
// rvd = Router View Depth
export const viewDepthKey = PolySymbol(
  __DEV__ ? 'router view depth' : 'rvd'
) as InjectionKey<number>

// r = router
export const routerKey = PolySymbol(__DEV__ ? 'router' : 'r') as InjectionKey<
  Router
>
// rt = route location
export const routeLocationKey = PolySymbol(
  __DEV__ ? 'route location' : 'rl'
) as InjectionKey<RouteLocationNormalizedLoaded>
