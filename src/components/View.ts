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

    const ViewComponent = computed<Component | undefined>(() => {
      const matched = route.value.matched[depth]

      return matched && matched.components[props.name]
    })

    return () => {
      return ViewComponent.value
        ? h(ViewComponent.value as any, { ...attrs })
        : null
    }
  },
})

export default View
