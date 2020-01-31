import { createRouter, Router } from './router'
import { App, Ref, inject, getCurrentInstance } from '@vue/runtime-core'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import View from './components/View'
import Link from './components/Link'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
  NavigationGuard,
} from './types'
import { RouteRecordNormalized } from './matcher/types'

declare module '@vue/runtime-core' {
  function inject(name: 'router'): Router
  function inject(name: 'route'): Ref<RouteLocationNormalized>
  function inject(name: 'matchedRoute'): Ref<RouteRecordNormalized>
}

// @ts-ignore: we are not importing it so it complains
declare module '@vue/runtime-dom' {
  function inject(name: 'router'): Router
  function inject(name: 'route'): RouteLocationNormalized
}

// @ts-ignore: we are not importing it so it complains
declare module 'vue' {
  function inject<T>(name: string, defaultValue: T): T
  function inject(name: 'router'): Router
  function inject(name: 'route'): RouteLocationNormalized
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

function onRouteLeave(leaveGuard: NavigationGuard) {
  const matched = inject('matchedRoute').value
  if (!matched) {
    console.log('no matched record')
    return
  }

  matched.leaveGuards.push(leaveGuard.bind(getCurrentInstance()!.proxy))
}

export {
  createHistory,
  createMemoryHistory,
  createHashHistory,
  createRouter,
  RouteLocationNormalized,
  Router,
  START_LOCATION,
  onRouteLeave,
}
