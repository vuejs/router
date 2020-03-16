import { InjectionKey, Ref, inject } from 'vue'
import { Router, RouteLocationNormalized } from '.'
import { RouteLocationNormalizedResolved } from './types'

export const routerKey = ('router' as unknown) as InjectionKey<Router>
export const routeKey = ('route' as unknown) as InjectionKey<
  Ref<RouteLocationNormalizedResolved>
>

export function useRouter(): Router {
  return inject(routerKey)!
}

export function useRoute(): Ref<RouteLocationNormalized> {
  return inject(routeKey)!
}
