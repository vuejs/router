import { InjectionKey, ComputedRef } from 'vue'
import { RouteLocationNormalizedLoaded } from '../types'
import { Router } from '../router'
import { RouteRecordNormalized } from '../matcher/types'

export const hasSymbol =
  typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol'

export const PolySymbol = (name: string) =>
  // vr = vue router
  hasSymbol ? Symbol(name) : `_vr_` + name

// rvlm = Router View Location Matched
export const matchedRouteKey = PolySymbol('rvlm') as InjectionKey<
  ComputedRef<RouteRecordNormalized | undefined>
>
// rvd = Router View Depth
export const viewDepthKey = PolySymbol('rvd') as InjectionKey<number>

// r = router
export const routerKey = PolySymbol('r') as InjectionKey<Router>
// rt = route location
export const routeLocationKey = PolySymbol('rl') as InjectionKey<
  RouteLocationNormalizedLoaded
>
