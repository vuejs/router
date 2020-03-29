import { inject } from 'vue'
import { routerKey, routeLocationKey } from './utils/injectionSymbols'
import { Router } from './router'
import { RouteLocationNormalizedResolved } from './types'

export function useRouter(): Router {
  return inject(routerKey)!
}

export function useRoute(): RouteLocationNormalizedResolved {
  return inject(routeLocationKey)!
}
