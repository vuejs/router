import { createRouter, Router } from './router'
import { Ref, InjectionKey } from 'vue'
import createHistory from './history/html5'
import createMemoryHistory from './history/memory'
import createHashHistory from './history/hash'
import {
  RouteLocationNormalized,
  START_LOCATION_NORMALIZED as START_LOCATION,
} from './types'
import { onBeforeRouteLeave } from './navigationGuards'

// necessary for webpack
///<reference path="global.d.ts"/>

declare module 'vue' {
  function inject<T>(key: InjectionKey<T> | string): T | undefined
  function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T
  function inject(key: InjectionKey<any> | string, defaultValue?: unknown): any
  function inject(name: 'router'): Router
  function inject(name: 'route'): Ref<RouteLocationNormalized>
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
