import { createRouter, Router } from './router'
import { App } from '@vue/runtime-core'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import View from './components/View'
import Link from './components/Link'
import { RouteLocationNormalized } from './types'

declare module '@vue/runtime-core' {
  function inject(name: 'router'): Router
  function inject(name: 'route'): RouteLocationNormalized
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
  app.mixin({
    beforeCreate() {
      if (!started) {
        router.setActiveApp(this)

        router.doInitialNavigation().catch(err => {
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
}
