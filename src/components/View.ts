import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  Component,
  InjectionKey,
  Ref,
} from 'vue'
import { RouteRecordNormalized } from '../matcher/types'
import { routeKey } from '../injectKeys'

// TODO: make it work with no symbols too for IE
export const matchedRouteKey = Symbol() as InjectionKey<
  Ref<RouteRecordNormalized>
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

    const matchedRoute = computed(() => route.value.matched[depth])
    const ViewComponent = computed<Component | undefined>(
      () => matchedRoute.value && matchedRoute.value.components[props.name]
    )

    const propsData = computed(() => {
      if (!matchedRoute.value.props) return {}

      return route.value.params
    })

    provide(matchedRouteKey, matchedRoute)

    return () => {
      return ViewComponent.value
        ? h(ViewComponent.value as any, { ...propsData.value, ...attrs })
        : null
    }
  },
})
