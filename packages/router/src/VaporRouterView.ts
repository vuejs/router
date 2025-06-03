import {
  inject,
  provide,
  PropType,
  ref,
  unref,
  ComponentPublicInstance,
  VNodeProps,
  computed,
  AllowedComponentProps,
  ComponentCustomProps,
  watch,
  VNode,
  createTemplateRefSetter,
  createComponent,
  createDynamicComponent,
  defineVaporComponent,
  type VaporComponent,
  type VaporSlot,
} from 'vue'
import type { RouteLocationNormalizedLoaded } from './typed-routes'
import type { RouteLocationMatched } from './types'
import {
  matchedRouteKey,
  viewDepthKey,
  routerViewLocationKey,
} from './injectionSymbols'
import { assign } from './utils'
import { isSameRouteRecord } from './location'
import type { RouterViewProps, RouterViewDevtoolsContext } from './RouterView'

export type { RouterViewProps, RouterViewDevtoolsContext }

export const VaporRouterViewImpl = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterView',
  // #674 we manually inherit them
  inheritAttrs: false,
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
    route: Object as PropType<RouteLocationNormalizedLoaded>,
  },

  // Better compat for @vue/compat users
  // https://github.com/vuejs/router/issues/1315
  // @ts-ignore
  compatConfig: { MODE: 3 },

  setup(props, { attrs, slots }) {
    const injectedRoute = inject(routerViewLocationKey)!
    const routeToDisplay = computed<RouteLocationNormalizedLoaded>(
      () => props.route || injectedRoute.value
    )
    const injectedDepth = inject(viewDepthKey, 0)
    // The depth changes based on empty components option, which allows passthrough routes e.g. routes with children
    // that are used to reuse the `path` property
    const depth = computed<number>(() => {
      let initialDepth = unref(injectedDepth)
      const { matched } = routeToDisplay.value
      let matchedRoute: RouteLocationMatched | undefined
      while (
        (matchedRoute = matched[initialDepth]) &&
        !matchedRoute.components
      ) {
        initialDepth++
      }
      return initialDepth
    })
    const matchedRouteRef = computed<RouteLocationMatched | undefined>(
      () => routeToDisplay.value.matched[depth.value]
    )

    provide(
      viewDepthKey,
      computed(() => depth.value + 1)
    )
    provide(matchedRouteKey, matchedRouteRef)
    provide(routerViewLocationKey, routeToDisplay)

    const viewRef = ref<ComponentPublicInstance>()

    // watch at the same time the component instance, the route record we are
    // rendering, and the name
    watch(
      () => [viewRef.value, matchedRouteRef.value, props.name] as const,
      ([instance, to, name], [oldInstance, from]) => {
        // copy reused instances
        if (to) {
          // this will update the instance for new instances as well as reused
          // instances when navigating to a new route
          to.instances[name] = instance
          // the component instance is reused for a different route or name, so
          // we copy any saved update or leave guards. With async setup, the
          // mounting component will mount before the matchedRoute changes,
          // making instance === oldInstance, so we check if guards have been
          // added before. This works because we remove guards when
          // unmounting/deactivating components
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards
            }
          }
        }

        // trigger beforeRouteEnter next callbacks
        if (
          instance &&
          to &&
          // if there is no instance but to and from are the same this might be
          // the first visit
          (!from || !isSameRouteRecord(to, from) || !oldInstance)
        ) {
          ;(to.enterCallbacks[name] || []).forEach(callback =>
            callback(instance)
          )
        }
      },
      { flush: 'post' }
    )

    const ViewComponent = computed(() => {
      const matchedRoute = matchedRouteRef.value
      return matchedRoute && matchedRoute.components![props.name]
    })

    // props from route configuration
    const routeProps = computed(() => {
      const route = routeToDisplay.value
      const currentName = props.name
      const matchedRoute = matchedRouteRef.value
      const routePropsOption = matchedRoute && matchedRoute.props[currentName]
      return routePropsOption
        ? routePropsOption === true
          ? route.params
          : typeof routePropsOption === 'function'
            ? routePropsOption(route)
            : routePropsOption
        : null
    })

    const setRef = createTemplateRefSetter()

    return createDynamicComponent(() => {
      if (!ViewComponent.value) {
        return () =>
          normalizeSlot(slots.default, {
            Component: ViewComponent.value,
            route: routeToDisplay.value,
          })
      }

      return () => {
        const component = createComponent(
          ViewComponent.value as VaporComponent,
          {
            $: [() => assign({}, routeProps.value, attrs)],
          }
        )
        setRef(component, viewRef)

        return (
          normalizeSlot(slots.default, {
            Component: component,
            route: routeToDisplay.value,
          }) || component
        )
      }
    })
  },
})

function normalizeSlot(slot: VaporSlot | undefined, data: any) {
  if (!slot) return null
  return slot(data)
}

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
/**
 * Component to display the current route the user is at.
 */
export const VaporRouterView = VaporRouterViewImpl as unknown as {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterViewProps

    $slots: {
      default?: ({
        Component,
        route,
      }: {
        Component: VNode
        route: RouteLocationNormalizedLoaded
      }) => VNode[]
    }
  }
}
