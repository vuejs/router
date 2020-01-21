import { h, FunctionalComponent, inject } from '@vue/runtime-core'
import { Router } from '../'

interface Props {
  name: string
}

const View: FunctionalComponent<Props> = (props, { slots, attrs }) => {
  const router = inject<Router>('router')!

  const route = router.currentRoute.value

  let depth = 0

  // TODO: support nested router-views
  const matched = route.matched[depth]

  // render empty node if no matched route
  if (!matched) return null

  const component = matched.components[props.name || 'default']

  // TODO: remove any
  // const children = typeof slots.default === 'function' ? slots.default() : []
  return h(component as any, attrs, slots.default)
}

// View.props =

export default View
