import {
  Component,
  createApp,
  nextTick,
  ComputedRef,
  reactive,
  computed,
} from 'vue'
import * as runtimeDom from '@vue/runtime-dom'
import { compile } from '@vue/compiler-dom'
import { Router, RouteLocationNormalizedResolved } from '../src'
import { routerKey, routeLocationKey } from '../src/utils/injectionSymbols'

export function mount(
  router: Router,
  Component: Component & {
    template: string
    components?: Record<string, Component>
  },
  rootProps = {}
) {
  const { template, components, ...ComponentWithoutTemplate } = Component

  const app = createApp(ComponentWithoutTemplate as any, rootProps)

  const reactiveRoute = {} as {
    [k in keyof RouteLocationNormalizedResolved]: ComputedRef<
      RouteLocationNormalizedResolved[k]
    >
  }
  for (let key in router.currentRoute.value) {
    // @ts-ignore: the key matches
    reactiveRoute[key] = computed(() => router.currentRoute.value[key])
  }

  app.provide(routerKey, router)
  app.provide(routeLocationKey, reactive(reactiveRoute))

  for (const componentName in components) {
    app.component(componentName, components[componentName])
  }

  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  const codegen = compile(template, {
    mode: 'function',
    hoistStatic: true,
    prefixIdentifiers: true,
  })

  const render = new Function('Vue', codegen.code)(runtimeDom)

  // @ts-ignore
  ComponentWithoutTemplate.render = render

  app.mount(rootEl)

  return { app, el: rootEl }
}

export const tick = () =>
  new Promise(resolve => {
    nextTick(resolve)
  })
