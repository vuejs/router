import { createRouter, Router } from './router'
import { App, Ref, InjectionKey } from 'vue'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import { View } from './components/View'
import Link from './components/Link'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
import { onBeforeRouteLeave } from './navigationGuards'

declare module 'vue' {
  function inject<T>(key: InjectionKey<T> | string): T | undefined
  function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T
  function inject(key: InjectionKey<any> | string, defaultValue?: unknown): any
  function inject(name: 'router'): Router
  function inject(name: 'route'): Ref<RouteLocationNormalized>
}

export function RouterPlugin(app: App, router: Router) {
  // TODO: remove as any
  app.component('RouterLink', Link as any)
  app.component('RouterView', View as any)

  let started = false
  // TODO: can we use something that isn't a mixin?
  app.mixin({
    beforeCreate() {
      if (!started) {
        // TODO: this initial navigation is only necessary on client, on server it doesn't make sense
        // because it will create an extra unecessary navigation and could lead to problems
        router.push(router.history.location).catch(err => {
          console.error('Unhandled error', err)
        })
        started = true
      }
    },
  })

  // TODO: merge strats?

  app.provide('router', router)
  app.provide('route', router.currentRoute)
}

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
