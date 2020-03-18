import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  InjectionKey,
  ref,
  ComponentPublicInstance,
  ComputedRef,
} from 'vue'
import { routeKey } from '../injectKeys'
import { RouteLocationMatched } from '../types'

// TODO: make it work with no symbols too for IE
export const matchedRouteKey = Symbol() as InjectionKey<
  ComputedRef<RouteLocationMatched | undefined>
>

export const View = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
  },

  setup(props, { attrs }) {
    const route = inject(routeKey)!
    const depth: number = inject('routerViewDepth', 0)
    provide('routerViewDepth', depth + 1)

    const matchedRoute = computed(
      () => route.value.matched[depth] as RouteLocationMatched | undefined
    )
    const ViewComponent = computed(
      () => matchedRoute.value && matchedRoute.value.components[props.name]
    )

    const propsData = computed(() => {
      // propsData only gets called if ViewComponent.value exists and it depends on matchedRoute.value
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
    }

    return () => {
      return ViewComponent.value
        ? h(ViewComponent.value as any, {
            ...propsData.value,
            ...attrs,
            onVnodeMounted,
            ref: viewRef,
          })
        : null
    }
  },
})
