import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type PropType,
} from 'vue'
import { routerKey, routerViewLocationKey } from '../injectionSymbols'
import { isSameRouteLocationParams } from '../location'
import { diagnostics } from '../diagnostics'
import { isRouteLocation } from '../types'
import { isBrowser, noop } from '../utils'
import {
  guardEvent,
  includesParams,
  preferSingleVNode,
  type _RouterLinkI,
  type RouterLinkProps,
  type UseLinkDevtoolsContext,
  type UseLinkReturn,
} from '../RouterLink'
import type { NavigationFailure } from '../errors'
import type { RouteLocationRaw } from '../typed-routes'
import type {
  EXPERIMENTAL_Router,
  EXPERIMENTAL_RouteRecordNormalized,
} from './router'

export type { _RouterLinkI, RouterLinkProps, UseLinkReturn }

/**
 * Options passed to {@link useLink}.
 */
export interface UseLinkOptions {
  to: MaybeRefOrGetter<RouteLocationRaw>
  replace?: MaybeRefOrGetter<boolean | undefined>
  /**
   * Pass the returned promise of `router.push()` to
   * `document.startViewTransition()` if supported.
   */
  viewTransition?: MaybeRefOrGetter<boolean | undefined>
}

type Record_ = EXPERIMENTAL_RouteRecordNormalized

const orig = (r: Record_ | undefined) => r && (r.aliasOf || r)

const indexOfRecord = (matched: Record_[], record: Record_) =>
  matched.findIndex(r => orig(r) === orig(record))

/**
 * Returns the behavior of a {@link RouterLink} without the rendering part.
 * Active states compare against the route of the closest `RouterView`.
 */
export function useLink(options: UseLinkOptions): UseLinkReturn {
  const router = inject(routerKey) as unknown as EXPERIMENTAL_Router
  const currentRoute = inject(routerViewLocationKey)!

  const route = computed(() => {
    const to = toValue(options.to)
    if (__DEV__ && !isRouteLocation(to)) {
      diagnostics.VUE_ROUTER_R0050({ to })
    }
    return router.resolve(to)
  })

  // 0: inactive, 1: active, 2: exact active
  const state = computed<number>(() => {
    const target = route.value
    const matched = target.matched as unknown as Record_[]
    const current = currentRoute.value
    const currentMatched = current.matched as unknown as Record_[]
    const record = matched.at(-1)
    if (!record) return 0
    let i = indexOfRecord(currentMatched, record)
    const parent = matched.at(-2)
    // an index child shares the path matcher of its parent: on a sibling of
    // the index child, the link is active through the parent
    if (
      i < 0 &&
      parent &&
      orig(record)!.path === orig(parent)!.path &&
      orig(currentMatched.at(-1))?.path !== orig(parent)!.path
    ) {
      i = indexOfRecord(currentMatched, parent)
    }
    return i < 0 || !includesParams(current.params, target.params)
      ? 0
      : i === currentMatched.length - 1 &&
          isSameRouteLocationParams(current.params, target.params)
        ? 2
        : 1
  })

  const isActive = computed(() => state.value > 0)
  const isExactActive = computed(() => state.value > 1)

  function navigate(
    e: MouseEvent = {} as MouseEvent
  ): Promise<void | NavigationFailure> {
    if (guardEvent(e)) {
      const p = router[toValue(options.replace) ? 'replace' : 'push'](
        toValue(options.to)
      ).catch(noop)
      if (
        toValue(options.viewTransition) &&
        typeof document !== 'undefined' &&
        'startViewTransition' in document
      ) {
        document.startViewTransition(() => p)
      }
      return p
    }
    return Promise.resolve()
  }

  if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && isBrowser) {
    const instance = getCurrentInstance()
    if (instance) {
      const ctx = {} as UseLinkDevtoolsContext
      // @ts-expect-error: internal
      ;(instance.__vrl_devtools ||= []).push(ctx)
      watchEffect(
        () => {
          ctx.route = route.value
          ctx.isActive = isActive.value
          ctx.isExactActive = isExactActive.value
          ctx.error = isRouteLocation(toValue(options.to))
            ? null
            : 'Invalid "to" value'
        },
        { flush: 'post' }
      )
    }
  }

  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate,
  }
}

export const RouterLinkImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterLink',
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: true,
    },
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    custom: Boolean,
    ariaCurrentValue: {
      type: String as PropType<RouterLinkProps['ariaCurrentValue']>,
      default: 'page',
    },
    viewTransition: Boolean,
  },

  useLink,

  setup(props, { slots }) {
    // props are reactive: toValue() reads them lazily
    const { route, isActive, isExactActive, navigate } = useLink(
      props as UseLinkOptions
    )
    const { options } = inject(routerKey)!

    return () => {
      const r = route.value
      const active = isActive.value
      const exact = isExactActive.value
      const children =
        slots.default &&
        preferSingleVNode(
          slots.default({
            route: r,
            href: r.href,
            isActive: active,
            isExactActive: exact,
            navigate,
          })
        )
      return props.custom
        ? children
        : h(
            'a',
            {
              'aria-current': exact ? props.ariaCurrentValue : null,
              href: r.href,
              onClick: navigate,
              class: {
                [props.activeClass ??
                options.linkActiveClass ??
                'router-link-active']: active,
                [props.exactActiveClass ??
                options.linkExactActiveClass ??
                'router-link-exact-active']: exact,
              },
            },
            children
          )
    }
  },
})

/**
 * Component to render a link that triggers a navigation on click. Made for
 * `experimental_createRouter()`.
 */
export const RouterLink: _RouterLinkI = RouterLinkImpl as any
