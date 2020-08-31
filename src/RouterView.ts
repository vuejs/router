import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  ref,
  ComponentPublicInstance,
  VNodeProps,
  getCurrentInstance,
  computed,
  AllowedComponentProps,
  ComponentCustomProps,
} from 'vue'
import { RouteLocationNormalized, RouteLocationNormalizedLoaded } from './types'
import {
  matchedRouteKey,
  viewDepthKey,
  routeLocationKey,
} from './injectionSymbols'
import { assign } from './utils'
import { warn } from './warning'

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
    __DEV__ && warnDeprecatedUsage()

    const injectedRoute = inject(routeLocationKey)!
    const depth = inject(viewDepthKey, 0)
    const matchedRouteRef = computed(
      () => (props.route || injectedRoute).matched[depth]
    )

    provide(viewDepthKey, depth + 1)
    provide(matchedRouteKey, matchedRouteRef)

    const viewRef = ref<ComponentPublicInstance>()

    return () => {
      const route = props.route || injectedRoute
      const matchedRoute = matchedRouteRef.value
      const ViewComponent = matchedRoute && matchedRoute.components[props.name]

      if (!ViewComponent) {
        return slots.default
          ? slots.default({ Component: ViewComponent, route })
          : null
      }

      // props from route configration
      const routePropsOption = matchedRoute.props[props.name]
      const routeProps = routePropsOption
        ? routePropsOption === true
          ? route.params
          : typeof routePropsOption === 'function'
          ? routePropsOption(route)
          : routePropsOption
        : null

      // we need the value at the time we render because when we unmount, we
      // navigated to a different location so the value is different
      const currentName = props.name
      const onVnodeMounted = () => {
        matchedRoute.instances[currentName] = viewRef.value
        ;(matchedRoute.enterCallbacks[currentName] || []).forEach(callback =>
          callback(viewRef.value!)
        )
      }
      const onVnodeUnmounted = () => {
        // remove the instance reference to prevent leak
        matchedRoute.instances[currentName] = null
      }

      const component = h(
        ViewComponent,
        assign({}, routeProps, attrs, {
          onVnodeMounted,
          onVnodeUnmounted,
          ref: viewRef,
        })
      )

      return (
        // pass the vnode to the slot as a prop.
        // h and <component :is="..."> both accept vnodes
        slots.default
          ? slots.default({ Component: component, route })
          : component
      )
    }
  },
})

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
export const RouterView = (RouterViewImpl as any) as {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterViewProps
  }
}

// warn against deprecated usage with <transition> & <keep-alive>
// due to functional component being no longer eager in Vue 3
function warnDeprecatedUsage() {
  const instance = getCurrentInstance()!
  const parentName = instance.parent && instance.parent.type.name
  if (
    parentName &&
    (parentName === 'KeepAlive' || parentName.includes('Transition'))
  ) {
    const comp = parentName === 'KeepAlive' ? 'keep-alive' : 'transition'
    warn(
      `<router-view> can no longer be used directly inside <transition> or <keep-alive>.\n` +
        `Use slot props instead:\n\n` +
        `<router-view v-slot="{ Component }">\n` +
        `  <${comp}>\n` +
        `    <component :is="Component" />\n` +
        `  </${comp}>\n` +
        `</router-view>`
    )
  }
}
