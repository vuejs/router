import {
  computed,
  createComponent,
  createDynamicComponent,
  createTemplateRefSetter,
  defineVaporComponent,
  isVaporComponent,
  nextTick,
  onActivated,
  onMounted,
  onUnmounted,
  watch,
  type Block,
  type VaporComponent,
  type VaporComponentInstance,
} from 'vue'
import type { RouteLocationNormalizedLoaded } from '../../typed-routes'
import type { RouteLocationMatched } from '../../types'
import {
  routerViewProps,
  useRouterViewState,
  type RouterViewDevtoolsContext,
  type RouterViewProps,
} from '../../RouterView'
import { assign, isBrowser } from '../../utils'

export type { RouterViewProps }

export const RouterViewImpl = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterView',
  // #674 we manually inherit them
  inheritAttrs: false,
  props: routerViewProps,

  setup(props, { attrs, slots }) {
    const [routeToDisplay, matchedRouteRef, viewRef, settle, depth] =
      useRouterViewState(props)
    const ViewComponent = computed(() => {
      const matchedRoute = matchedRouteRef.value
      return matchedRoute && matchedRoute.components![props.name]
    })
    const setRef = createTemplateRefSetter()
    // last created view, undefined if nothing is displayed
    let view: VaporComponentInstance | undefined

    const settleView = () => {
      const route = routeToDisplay.value
      nextTick(() => {
        // mounted views: Transition out-in mounts them later
        if (
          view &&
          (!isVaporComponent(view) || (view.isMounted && !view.isDeactivated))
        ) {
          settle(route)
        }
      })
    }
    // reused and activated views
    watch(routeToDisplay, settleView, { flush: 'post' })

    // the instance is created when read, so KeepAlive can cache it
    const slotProps = {
      get Component() {
        const Component = ViewComponent.value as VaporComponent | undefined
        if (!Component) return (view = undefined)
        // a view created but not mounted yet is reused, e.g. when read by
        // `v-if` and `:is`
        if (!view || view.type !== Component || view.isMounted) {
          // only read ViewComponent: a new route record with the same
          // component must reuse the view
          const name = props.name
          view = createComponent(Component, {
            $: [
              () => {
                const route = routeToDisplay.value
                const routePropsOption =
                  matchedRouteRef.value!.props[props.name]
                return assign(
                  {},
                  routePropsOption
                    ? routePropsOption === true
                      ? route.params
                      : typeof routePropsOption === 'function'
                        ? routePropsOption(route)
                        : routePropsOption
                    : null,
                  attrs
                )
              },
            ],
          })
          setRef(view, viewRef)
          // VDOM component through vaporInteropPlugin
          if (!isVaporComponent(view)) settleView()
          // not cached by KeepAlive
          else if (!view.isMounted) {
            const instance = view
            let record: RouteLocationMatched | undefined
            onMounted(() => {
              record = matchedRouteRef.value
              if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && isBrowser) {
                // @ts-expect-error: internal
                instance.__vrv_devtools = {
                  depth: depth!.value,
                  name: record!.name,
                  path: record!.path,
                  meta: record!.meta,
                } satisfies RouterViewDevtoolsContext
              }
              settleView()
            }, instance)
            // a new function: the hook is wrapped once per function
            onActivated(() => settleView(), instance)
            // remove the instance reference to prevent leak
            onUnmounted(
              () => record && (record.instances[name] = null),
              instance
            )
          }
        }
        return view
      },
      get route() {
        return routeToDisplay.value
      },
    }

    return slots.default
      ? slots.default(slotProps)
      : createDynamicComponent(() => slotProps.Component)
  },
})

/**
 * Vapor version of `RouterView`. Displays the component of the current route.
 */
export const RouterView = RouterViewImpl as unknown as {
  new (): {
    $props: RouterViewProps
    $slots: {
      default?: (scope: {
        /**
         * Route component, rendered with `<component :is="Component" />`.
         * `undefined` if no component matches.
         */
        Component: Block | undefined
        route: RouteLocationNormalizedLoaded
      }) => Block
    }
  }
}
