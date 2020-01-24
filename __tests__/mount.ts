import { Component, createApp } from 'vue'
import * as runtimeDom from '@vue/runtime-dom'
import { compile } from '@vue/compiler-dom'
import { Router } from '../src'

export function mount(
  router: Router,
  Component: Component & {
    template: string
  },
  rootProps = {}
) {
  const app = createApp()
  app.provide('router', router)

  const rootEl = document.createElement('div')
  document.body.appendChild(rootEl)

  const { template, ...ComponentWithoutTemplate } = Component
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
