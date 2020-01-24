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
    const router = inject('router')
    const depth: number = inject('routerViewDepth', 0)
    provide('routerViewDepth', depth + 1)

    const ViewComponent = computed<Component | void>(() => {
      const matched = router.currentRoute.value.matched[depth]

      if (!matched) return null

      return matched.components[props.name]
    })

    return () =>
      ViewComponent.value ? h(ViewComponent.value as any, attrs) : []
  },
})

export default View
