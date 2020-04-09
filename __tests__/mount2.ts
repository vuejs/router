import {
  Component,
  createApp,
  defineComponent,
  h,
  ref,
  ComponentPublicInstance,
  reactive,
  nextTick,
  ComponentObjectPropsOptions,
  ComputedRef,
  computed,
  markNonReactive,
  App,
  ComponentOptionsWithProps,
} from 'vue'
import { RouteLocationNormalizedLoose } from './utils'
import { routeLocationKey } from '../src/utils/injectionSymbols'

interface MountOptions {
  propsData: Record<string, any>
  provide: Record<string | symbol, any>
  components: ComponentOptionsWithProps['components']
}
// { app, vm: instance!, el: rootEl, setProps, provide }
interface Wrapper {
  app: App
  vm: ComponentPublicInstance
  rootEl: HTMLDivElement
  setProps(props: MountOptions['propsData']): Promise<void>
  html(): string
}

function initialProps<P>(propsOption: ComponentObjectPropsOptions<P>) {
  let copy = {} as ComponentPublicInstance<typeof propsOption>['$props']

  for (let key in propsOption) {
    const prop = propsOption[key]!
    // @ts-ignore
    if (!prop.required && prop.default)
      // TODO: function value
      // @ts-ignore
      copy[key] = prop.default
  }

  return copy
}

export function mount(
  // TODO: generic?
  targetComponent: Parameters<typeof createApp>[0],
  options: Partial<MountOptions> = {}
): Promise<Wrapper> {
  const TargetComponent = targetComponent as Component
  return new Promise(resolve => {
    // TODO: props can only be an object
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

    const Wrapper = defineComponent({
      setup(_props, { emit }) {
        const componentInstanceRef = ref<ComponentPublicInstance>()

        return () => {
          return h(TargetComponent, {
            ref: componentInstanceRef,
            onVnodeMounted() {
              emit('ready', componentInstanceRef.value)
            },
            ...propsData,
          })
        }
      },
    })

    const app = createApp(Wrapper, {
      onReady: (instance: ComponentPublicInstance) => {
        resolve({ app, vm: instance!, rootEl, setProps, html })
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

    // TODO: how to cleanup?
    const rootEl = document.createElement('div')
    document.body.appendChild(rootEl)

    function html() {
      return rootEl.innerHTML
    }

    app.mount(rootEl)
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

  const routeRef = ref(markNonReactive(initialValue))

  function set(newRoute: RouteLocationNormalizedLoose) {
    routeRef.value = markNonReactive(newRoute)
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
