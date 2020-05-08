import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  ref,
  ComponentPublicInstance,
  VNodeProps,
} from 'vue'
import { RouteLocationNormalizedLoaded, RouteLocationNormalized } from './types'
import {
  matchedRouteKey,
  viewDepthKey,
  routeLocationKey,
} from './injectionSymbols'

export interface RouterViewProps {
  name?: string
  // allow looser type for user facing api
  route?: RouteLocationNormalized
}

export const RouterViewImpl = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
    route: Object as PropType<RouteLocationNormalizedLoaded>,
  },

  setup(props, { attrs, slots }) {
    const realRoute = inject(routeLocationKey)!
    const route = computed(() => props.route || realRoute)

    const depth: number = inject(viewDepthKey, 0)
    provide(viewDepthKey, depth + 1)

    const matchedRoute = computed(
      () =>
        route.value.matched[depth] as
          | RouteLocationNormalizedLoaded['matched'][any]
          | undefined
    )
    const ViewComponent = computed(
      () => matchedRoute.value && matchedRoute.value.components[props.name]
    )

    const propsData = computed(() => {
      // propsData only gets called if ViewComponent.value exists and it depends
      // on matchedRoute.value
      const { props } = matchedRoute.value!
      if (!props) return {}
      if (props === true) return route.value.params

      return typeof props === 'object' ? props : props(route.value)
    })

    provide(matchedRouteKey, matchedRoute)

    const viewRef = ref<ComponentPublicInstance>()

    function onVnodeMounted() {
      // if we mount, there is a matched record
      matchedRoute.value!.instances[props.name] = viewRef.value
      // TODO: trigger beforeRouteEnter hooks
      // TODO: watch name to update the instance record
    }

    return () => {
      // we nee the value at the time we render because when we unmount, we
      // navigated to a different location so the value is different
      const currentMatched = matchedRoute.value
      const currentName = props.name
      function onVnodeUnmounted() {
        if (currentMatched) {
          // remove the instance reference to prevent leak
          currentMatched.instances[currentName] = null
        }
      }

      let Component = ViewComponent.value
      const componentProps: Parameters<typeof h>[1] = {
        // only compute props if there is a matched record
        ...(Component && propsData.value),
        ...attrs,
        onVnodeMounted,
        onVnodeUnmounted,
        ref: viewRef,
      }

      // NOTE: we could also not render if there is no route match
      const children =
        slots.default && slots.default({ Component, props: componentProps })

      return children
        ? children
        : Component
        ? h(Component, componentProps)
        : null
    }
  },
})

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
export const RouterView = (RouterViewImpl as any) as {
  new (): {
    $props: VNodeProps & RouterViewProps
  }
}
