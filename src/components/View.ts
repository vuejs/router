import { h, inject, FunctionalComponent } from 'vue'
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
  return h(component as any, attrs, slots.default)
}

// View.props =

export default View
