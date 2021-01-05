import {
  defineComponent,
  h,
  reactive,
  nextTick,
  ComputedRef,
  computed,
  shallowRef,
} from 'vue'
import { compile } from '@vue/compiler-dom'
import * as runtimeDom from '@vue/runtime-dom'
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

export function compileSlot(template: string) {
  const codegen = compile(template, {
    mode: 'function',
    hoistStatic: true,
    prefixIdentifiers: true,
  })

  const render = new Function('Vue', codegen.code)(runtimeDom)

  const ToRender = defineComponent({
    render,
    inheritAttrs: false,

    setup(props, { attrs }) {
      return { ...attrs }
    },
  })

  return (propsData: any) => h(ToRender, { ...propsData })
}
