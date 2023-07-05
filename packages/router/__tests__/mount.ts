import { nextTick, shallowRef, shallowReactive } from 'vue'
import { RouteLocationNormalizedLoose } from './utils'
import {
  routeLocationKey,
  routerViewLocationKey,
} from '../src/injectionSymbols'
import { RouteLocationNormalized } from '../src'

export function createMockedRoute(
  initialValue: RouteLocationNormalizedLoose | RouteLocationNormalized
) {
  const routeRef = shallowRef<
    RouteLocationNormalized | RouteLocationNormalizedLoose
  >(initialValue)

  function set(
    newRoute: RouteLocationNormalizedLoose | RouteLocationNormalized
  ) {
    routeRef.value = newRoute
    return nextTick()
  }

  const route = {} as RouteLocationNormalizedLoose

  for (let key in initialValue) {
    Object.defineProperty(route, key, {
      enumerable: true,
      get: () => routeRef.value[key as keyof RouteLocationNormalizedLoose],
    })
  }

  const value = shallowReactive(route)

  return {
    value,
    set,
    provides: {
      [routeLocationKey as symbol]: value,
      [routerViewLocationKey as symbol]: routeRef,
    },
  }
}
