import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  ref,
  ComponentPublicInstance,
  VNodeProps,
  computed,
  AllowedComponentProps,
  ComponentCustomProps,
  watch,
  Suspense,
} from 'vue'
import {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  RouteLocationMatched,
} from './types'
import {
  matchedRouteKey,
  viewDepthKey,
  routerViewLocationKey,
  suspendedRouteKey,
} from './injectionSymbols'
import { assign } from './utils'
import { isSameRouteRecord } from './location'

export interface RouterViewSuspendedProps {
  name?: string
  // allow looser type for user facing api
  route?: RouteLocationNormalized
}

export const RouterViewSuspendedImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterViewSuspended',
  // #674 we manually inherit them
  inheritAttrs: false,
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
    route: Object as PropType<RouteLocationNormalizedLoaded>,
  },

  setup(props, { attrs }) {
    const injectedRoute = inject(routerViewLocationKey)!
    const isSuspended = inject('isSuspended', false as boolean)
    // TODO: should be pending route -> after leave, update and global navigation guards
    const suspendedRoute = inject(suspendedRouteKey)!
    const routeToDisplay = computed(() => props.route || injectedRoute.value)
    const depth = inject(viewDepthKey, 0)
    const matchedRouteRef = computed<RouteLocationMatched | undefined>(
      () => routeToDisplay.value.matched[depth]
    )
    const suspendedMatchedRouteRef = computed<
      RouteLocationMatched | undefined | null
    >(() => suspendedRoute.value && suspendedRoute.value.matched[depth])

    provide(viewDepthKey, depth + 1)
    provide(matchedRouteKey, matchedRouteRef)
    provide(routerViewLocationKey, routeToDisplay)
    provide('isSuspended', true)

    const viewRef = ref<ComponentPublicInstance>()

    // watch at the same time the component instance, the route record we are
    // rendering, and the name
    watch(
      () => [viewRef.value, matchedRouteRef.value, props.name] as const,
      ([instance, to, name], [oldInstance, from, oldName]) => {
        // copy reused instances
        if (to) {
          // this will update the instance for new instances as well as reused
          // instances when navigating to a new route
          to.instances[name] = instance
          // the component instance is reused for a different route or name so
          // we copy any saved update or leave guards
          if (from && from !== to && instance && instance === oldInstance) {
            to.leaveGuards = from.leaveGuards
            to.updateGuards = from.updateGuards
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

    return () => {
      const route = routeToDisplay.value
      const matchedRoute = matchedRouteRef.value
      const suspendedMatchedRoute = suspendedMatchedRouteRef.value
      const ViewComponent = matchedRoute && matchedRoute.components[props.name]
      const SuspendedViewComponent =
        suspendedMatchedRoute && suspendedMatchedRoute.components[props.name]
      // we need the value at the time we render because when we unmount, we
      // navigated to a different location so the value is different
      const currentName = props.name

      console.log('suspended', suspendedMatchedRoute)

      // TODO: should be smarter to still display a suspended component
      if (!ViewComponent) {
        return null
      }

      // props from route configuration
      const routePropsOption = matchedRoute!.props[props.name]
      const routeProps = routePropsOption
        ? routePropsOption === true
          ? route.params
          : typeof routePropsOption === 'function'
          ? routePropsOption(route)
          : routePropsOption
        : null

      const onVnodeUnmounted: VNodeProps['onVnodeUnmounted'] = vnode => {
        // remove the instance reference to prevent leak
        if (vnode.component!.isUnmounted) {
          matchedRoute!.instances[currentName] = null
        }
      }

      function onPending(...args: any[]) {
        console.log('pending', ...args)
      }

      function onResolve(...args: any[]) {
        console.log('resolve', ...args)
      }

      function onFallback(...args: any[]) {
        console.log('fallback', ...args)
      }

      const component = h(
        ViewComponent,
        assign({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef,
        })
      )

      return isSuspended
        ? component
        : h(
            Suspense,
            {
              timeout: 0,
              onPending,
              onResolve,
              onFallback,
            },
            component
          )
    }
  },
})

// export the public type for h/tsx inference
// also to avoid inline import() in generated d.ts files
/**
 * Component to display the current route the user is at.
 */
export const RouterViewSuspended = (RouterViewSuspendedImpl as any) as {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterViewSuspendedProps
  }
}
