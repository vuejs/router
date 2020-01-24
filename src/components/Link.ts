import { defineComponent, h, PropType, inject } from '@vue/runtime-core'
import { computed, reactive, isRef, Ref } from '@vue/reactivity'
import { RouteLocation } from '../types'

export function useLink(to: Ref<RouteLocation> | RouteLocation) {
  const router = inject('router')

  const route = computed(() => router.resolve(isRef(to) ? to.value : to))
  const href = computed(() => router.createHref(route.value))
  const isActive = computed<boolean>(
    () => router.currentRoute.value.path.indexOf(route.value.path) === 0
  )

  // TODO: handle replace prop

  function navigate(e: MouseEvent) {
    // TODO: handle navigate with empty parameters for scoped slot and composition api
    if (guardEvent(e)) router.push(route.value)
  }

  return {
    route,
    href,
    isActive,
    navigate,
  }
}

const Link = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocation>,
      required: true,
    },
  },

  setup(props, { slots, attrs }) {
    const { route, isActive, href, navigate } = useLink(props.to)

    const elClass = computed(() => ({
      'router-link-active': isActive.value,
    }))

    // TODO: exact active classes
    // TODO: handle replace prop

    return () => {
      return h(
        'a',
        {
          class: elClass.value,
          onClick: navigate,
          href: href.value,
          ...attrs,
        },
        slots.default(reactive({ route, href, isActive }))
      )
    }
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
