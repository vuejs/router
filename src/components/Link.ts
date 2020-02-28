import {
  defineComponent,
  h,
  PropType,
  inject,
  computed,
  reactive,
  Ref,
  unref,
} from 'vue'
import { RouteLocation, RouteLocationNormalized, Immutable } from '../types'
import { isSameLocationObject } from '../utils'
import { routerKey } from '../injectKeys'
import { RouteRecordNormalized } from '../matcher/types'

type VueUseOptions<T> = {
  [k in keyof T]: Ref<T[k]> | T[k]
}

interface LinkProps {
  to: RouteLocation
  // TODO: refactor using extra options allowed in router.push
  replace?: boolean
}

type UseLinkOptions = VueUseOptions<LinkProps>

function isSameRouteRecord(
  a: Immutable<RouteRecordNormalized>,
  b: Immutable<RouteRecordNormalized>
): boolean {
  // TODO: handle aliases
  return a === b
}

function includesParams(
  outter: Immutable<RouteLocationNormalized['params']>,
  inner: Immutable<RouteLocationNormalized['params']>
): boolean {
  for (let key in inner) {
    let innerValue = inner[key]
    let outterValue = outter[key]
    if (typeof innerValue === 'string') {
      if (innerValue !== outterValue) return false
    } else {
      if (
        !Array.isArray(outterValue) ||
        innerValue.some((value, i) => value !== outterValue[i])
      )
        return false
    }
  }

  return true
}

// TODO: what should be accepted as arguments?
export function useLink(props: UseLinkOptions) {
  const router = inject(routerKey)!

  const route = computed(() => router.resolve(unref(props.to)))
  const href = computed(() => router.createHref(route.value))

  const activeRecordIndex = computed<number>(() => {
    const currentMatched = route.value.matched[route.value.matched.length - 1]
    return router.currentRoute.value.matched.findIndex(
      isSameRouteRecord.bind(null, currentMatched)
    )
  })

  const isActive = computed<boolean>(
    () =>
      activeRecordIndex.value > -1 &&
      includesParams(router.currentRoute.value.params, route.value.params)
  )
  const isExactActive = computed<boolean>(
    () =>
      activeRecordIndex.value ===
        router.currentRoute.value.matched.length - 1 &&
      isSameLocationObject(router.currentRoute.value.params, route.value.params)
  )

  // TODO: handle replace prop
  // const method = unref(rep)

  function navigate(e: MouseEvent = {} as MouseEvent) {
    // TODO: handle navigate with empty parameters for scoped slot and composition api
    if (guardEvent(e)) router.push(route.value)
  }

  return {
    route,
    href,
    isActive,
    isExactActive,
    navigate,
  }
}

export const Link = defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocation>,
      required: true,
    },
  },

  setup(props, { slots, attrs }) {
    const { route, isActive, isExactActive, href, navigate } = useLink(props)

    const elClass = computed(() => ({
      'router-link-active': isActive.value,
      'router-link-exact-active': isExactActive.value,
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
