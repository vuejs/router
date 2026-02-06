import {
  nextTick,
  shallowRef,
  shallowReactive,
  VaporComponentOptions,
  createVaporApp,
  VaporKeepAlive,
} from 'vue'
import { RouteLocationNormalizedLoose } from './utils'
import {
  routeLocationKey,
  routerViewLocationKey,
} from '../src/injectionSymbols'
import { RouteLocationNormalized, VaporRouterView } from '../src'
import { afterEach, beforeEach } from 'vitest'

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

export function createVaporMount() {
  let element = undefined as unknown as Element
  let currentApp: ReturnType<typeof createVaporApp> | undefined
  beforeEach(() => {
    element = document.createElement('div')
    element.setAttribute('id', 'host')
    document.body.appendChild(element)
  })
  afterEach(() => {
    currentApp?.unmount()
    currentApp = undefined
    element.remove()
  })

  return function mount(
    comp: VaporComponentOptions,
    props: any = {},
    provides: any = {}
  ) {
    const app = createVaporApp(comp, props)
    app._context.provides = provides
    app._context.components = {
      RouterView: VaporRouterView,
      KeepAlive: VaporKeepAlive,
    }
    app.mount(element)
    currentApp = app
    return {
      element,
      html: () => element.innerHTML,
      find: (selector: string) =>
        element.querySelector(selector) as
          | (Element & { click: () => any })
          | undefined,
    }
  }
}
