import { createRouter, Router } from './router'
import { App } from '@vue/runtime-core'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import View from './components/View'
import Link from './components/Link'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'

declare module '@vue/runtime-core' {
  function inject(name: 'router'): Router
  function inject(name: 'route'): RouteLocationNormalized
  function inject(name: 'routerViewDepth'): number
}

// @ts-ignore: we are not importing it so it complains
declare module '@vue/runtime-dom' {
  function inject(name: 'router'): Router
  function inject(name: 'route'): RouteLocationNormalized
}

// @ts-ignore: we are not importing it so it complains
declare module 'vue' {
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
        router.setActiveApp(this)

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
}
