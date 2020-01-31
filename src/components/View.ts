import {
  h,
  inject,
  provide,
  defineComponent,
  PropType,
  computed,
  Component,
} from '@vue/runtime-core'

const View = defineComponent({
  name: 'RouterView',
  props: {
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
  },

  setup(props, { attrs }) {
    const route = inject('route')
    const depth: number = inject('routerViewDepth', 0)
    provide('routerViewDepth', depth + 1)

    const matchedRoute = computed(() => route.value.matched[depth])
    const ViewComponent = computed<Component | undefined>(
      () => matchedRoute.value && matchedRoute.value.components[props.name]
    )

    provide('matchedRoute', matchedRoute)

    return () => {
      return ViewComponent.value
        ? h(ViewComponent.value as any, { ...attrs })
        : null
    }
  },
})

export default View
