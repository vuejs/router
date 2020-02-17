import { InjectionKey, Ref, inject } from 'vue'
import { Router, RouteLocationNormalized } from '.'

export const routerKey = ('router' as unknown) as InjectionKey<Router>
export const routeKey = ('route' as unknown) as InjectionKey<
  Ref<RouteLocationNormalized>
>

export function useRouter(): Router {
  return inject(routerKey)!
}

export function useRoute(): Ref<RouteLocationNormalized> {
  return inject(routeKey)!
}
