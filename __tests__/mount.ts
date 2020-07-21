import {
  Component,
  createApp,
  defineComponent,
  h,
  ComponentPublicInstance,
  reactive,
  nextTick,
  ComponentObjectPropsOptions,
  ComputedRef,
  computed,
  App,
  VNode,
  shallowRef,
  ComponentOptions,
} from 'vue'
import { compile } from '@vue/compiler-dom'
import * as runtimeDom from '@vue/runtime-dom'
import { RouteLocationNormalizedLoose } from './utils'
import { routeLocationKey } from '../src/injectionSymbols'
import { Router } from '../src'

export interface MountOptions {
  propsData: Record<string, any>
  provide: Record<string | symbol, any>
  components: ComponentOptions['components']
  slots: Record<string, string>
  router?: Router
}

interface Wrapper {
  app: App
  vm: ComponentPublicInstance
  rootEl: HTMLDivElement
  setProps(props: MountOptions['propsData']): Promise<void>
  html(): string
  find: typeof document['querySelector']
}

function initialProps<P>(propsOption: ComponentObjectPropsOptions<P>) {
  let copy = {} as ComponentPublicInstance<typeof propsOption>['$props']

  for (let key in propsOption) {
    const prop = propsOption[key]!
    // @ts-ignore
    if (!prop.required && prop.default)
      // @ts-ignore
      copy[key] = prop.default
  }

  return copy
}

// cleanup wrappers after a suite runs
let activeWrapperRemovers: Array<() => void> = []
afterAll(() => {
  activeWrapperRemovers.forEach(remove => remove())
  activeWrapperRemovers = []
})

export function mount(
  targetComponent: Parameters<typeof createApp>[0],
  options: Partial<MountOptions> = {}
): Promise<Wrapper> {
  const TargetComponent = targetComponent as Component
  return new Promise(resolve => {
    // NOTE: only supports props as an object
    const propsData = reactive(
      Object.assign(
        initialProps(TargetComponent.props || {}),
        options.propsData
      )
    )

    function setProps(partialProps: Record<string, any>) {
      Object.assign(propsData, partialProps)
      return nextTick()
    }

    let slots: Record<string, (propsData: any) => VNode> = {}

    const Wrapper = defineComponent({
      setup(_props, { emit }) {
        const componentInstanceRef = shallowRef<ComponentPublicInstance>()

        return () => {
          return h(
            TargetComponent,
            {
              ref: componentInstanceRef,
              onVnodeMounted() {
                emit('ready', componentInstanceRef.value)
              },
              ...propsData,
            },
            slots
          )
        }
      },
    })

    const app = createApp(Wrapper, {
      onReady: (instance: ComponentPublicInstance) => {
        resolve({ app, vm: instance!, rootEl, setProps, html, find })
      },
    })

    if (options.provide) {
      const keys = getKeys(options.provide)

      for (let key of keys) {
        app.provide(key, options.provide[key as any])
      }
    }

    if (options.components) {
      for (let key in options.components) {
        app.component(key, options.components[key])
      }
    }

    if (options.slots) {
      for (let key in options.slots) {
        slots[key] = compileSlot(options.slots[key])
      }
    }

    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)

    function html() {
      return rootEl.innerHTML
    }

    function find(selector: string) {
      return rootEl.querySelector(selector)
    }

    if (options.router) app.use(options.router)

    app.mount(rootEl)

    activeWrapperRemovers.push(() => {
      app.unmount(rootEl)
      rootEl.remove()
    })
  })
}

function getKeys(object: Record<string | symbol, any>): Array<symbol | string> {
  return (Object.getOwnPropertyNames(object) as Array<string | symbol>).concat(
    Object.getOwnPropertySymbols(object)
  )
}

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
    },
  }
}

function compileSlot(template: string) {
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
