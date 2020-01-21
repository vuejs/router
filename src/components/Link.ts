import { defineComponent, h, PropType, inject, computed } from 'vue'
import { Router } from '../router'
import { RouteLocation } from '../types'

const Link = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocation>,
      required: true,
    },
  },

  setup(props, context) {
    const router = inject<Router>('router')!

    const route = computed(() => router.resolve(props.to))

    // TODO: active classes
    // TODO: handle replace prop

    const onClick = (e: MouseEvent) => {
      // TODO: handle navigate with empty parameters for scoped slot and composition api
      if (guardEvent(e)) {
        router.push(route.value)
      }
    }

    return () =>
      h(
        'a',
        {
          onClick,
          href: router.createHref(route.value),
        },
        context.slots.default()
      )
  },
})

function guardEvent(e: MouseEvent) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return
  // don't redirect when preventDefault called
  if (e.defaultPrevented) return
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) return
  // don't redirect if `target="_blank"`
  // @ts-ignore getAttribute does exist
  if (e.currentTarget && e.currentTarget.getAttribute) {
    // @ts-ignore getAttribute exists
    const target = e.currentTarget.getAttribute('target')
    if (/\b_blank\b/i.test(target)) return
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) e.preventDefault()

  return true
}

export default Link
