import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  ref,
  ComponentPublicInstance,
  unref,
  SetupContext,
  toRefs,
} from 'vue'
import { VueUseOptions, RouteLocationNormalizedLoaded } from '../types'
import {
  matchedRouteKey,
  viewDepthKey,
  routeLocationKey,
} from '../utils/injectionSymbols'

interface ViewProps {
  route: RouteLocationNormalizedLoaded
  name: string
}

type UseViewOptions = VueUseOptions<ViewProps>

export function useView(options: UseViewOptions) {
  const depth: number = inject(viewDepthKey, 0)
  provide(viewDepthKey, depth + 1)

  const matchedRoute = computed(
    () =>
      unref(options.route).matched[depth] as
        | ViewProps['route']['matched'][any]
        | undefined
  )
  const ViewComponent = computed(
    () =>
      matchedRoute.value && matchedRoute.value.components[unref(options.name)]
  )

  const propsData = computed(() => {
    // propsData only gets called if ViewComponent.value exists and it depends on matchedRoute.value
    const { props } = matchedRoute.value!
    if (!props) return {}
    const route = unref(options.route)
    if (props === true) return route.params

    return typeof props === 'object' ? props : props(route)
  })

  provide(matchedRouteKey, matchedRoute)

  const viewRef = ref<ComponentPublicInstance>()

  function onVnodeMounted() {
    // if we mount, there is a matched record
    matchedRoute.value!.instances[unref(options.name)] = viewRef.value
    // TODO: trigger beforeRouteEnter hooks
  }

  return (attrs: SetupContext['attrs']) => {
    return ViewComponent.value
      ? h(ViewComponent.value as any, {
          ...propsData.value,
          ...attrs,
          onVnodeMounted,
          ref: viewRef,
        })
      : null
  }
}

export const View = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
  },

  setup(props, { attrs }) {
    const route = inject(routeLocationKey)!
    const renderView = useView({ route, name: toRefs(props).name })

    return () => renderView(attrs)
  },
})
