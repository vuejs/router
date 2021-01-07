import { reactive, nextTick, ComputedRef, computed, shallowRef } from 'vue'
import { RouteLocationNormalizedLoose } from './utils'
import {
  routeLocationKey,
  routerViewLocationKey,
} from '../src/injectionSymbols'

export function createMockedRoute(initialValue: RouteLocationNormalizedLoose) {
  const route = {} as {
    [k in keyof RouteLocationNormalizedLoose]: ComputedRef<
      RouteLocationNormalizedLoose[k]
    >
  }

  const routeRef = shallowRef(initialValue)

  function set(newRoute: RouteLocationNormalizedLoose) {
    routeRef.value = newRoute
    return nextTick()
  }

  for (let key in initialValue) {
    // @ts-ignore
    route[key] =
      // new line to still get errors here
      computed(() => routeRef.value[key as keyof RouteLocationNormalizedLoose])
  }

  const value = reactive(route)

  return {
    value,
    set,
    provides: {
      [routeLocationKey as symbol]: value,
      [routerViewLocationKey as symbol]: routeRef,
    },
  }
}
