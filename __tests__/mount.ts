import { Component, createApp, nextTick } from 'vue'
import * as runtimeDom from '@vue/runtime-dom'
import { compile } from '@vue/compiler-dom'
import { Router } from '../src'

export function mount(
  router: Router,
  Component: Component & {
    template: string
    components?: Record<string, Component>
  },
  rootProps = {}
) {
  // TODO: update with alpha-4
  const app = createApp()
  app.provide('router', router)
  app.provide('route', router.currentRoute)

  const { template, components, ...ComponentWithoutTemplate } = Component

  // @ts-ignore TODO: remove?
  ComponentWithoutTemplate.components = {}
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

  app.mount(ComponentWithoutTemplate as any, rootEl, rootProps)

  return { app, el: rootEl }
}

export const tick = () =>
  new Promise(resolve => {
    nextTick(resolve)
  })
