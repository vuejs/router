import { InjectionKey, Ref } from 'vue'
import { Router, RouteLocationNormalized } from '.'

export const routerKey = ('router' as unknown) as InjectionKey<Router>
export const routeKey = ('route' as unknown) as InjectionKey<
  Ref<RouteLocationNormalized>
>
