import { createRouter, Router } from './router'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
import { onBeforeRouteLeave } from './navigationGuards'

// declare module '@vue/runtime-core' {
//   interface Inject {
//     (name: 'router'): Router
//     (name: 'route'): Ref<RouteLocationNormalized>
//   }
// function inject<T>(key: InjectionKey<T> | string): T | undefined
// function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T
// function inject(key: InjectionKey<any> | string, defaultValue?: unknown): any
// export function inject(name: 'router'): Router
// export function inject(name: 'route'): Ref<RouteLocationNormalized>
// }

export * from './injectKeys'

export {
  createHistory,
  createMemoryHistory,
  createHashHistory,
  createRouter,
  RouteLocationNormalized,
  Router,
  START_LOCATION,
  onBeforeRouteLeave,
}
