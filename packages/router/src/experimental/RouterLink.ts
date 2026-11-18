import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  type VNode,
  toValue,
  watchEffect,
  type MaybeRefOrGetter,
  type PropType,
} from 'vue'
import { routerKey, routerViewLocationKey } from '../injectionSymbols'
import { diagnostics } from '../diagnostics'
import { isRouteLocation } from '../types'
import { isBrowser, noop } from '../utils'
import {
  shouldHandleLinkClick,
  getLinkActiveState,
  preferSingleVNode,
  type RouterLinkProps,
  type RouterLinkPropsTyped,
  type RouterLinkSlotScope,
  type UseLinkDevtoolsContext,
  type UseLinkReturn,
} from '../RouterLink'
import type { NavigationFailure } from '../errors'
import type { RouteLocationRaw } from '../typed-routes'
import type { EXPERIMENTAL_Router } from './router'

export type {
  RouterLinkI as _RouterLinkI,
  RouterLinkProps,
  RouterLinkSlotScope,
  UseLinkReturn,
}

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

  const activeState = computed(() =>
    getLinkActiveState(route.value, currentRoute.value)
  )
  const isActive = computed(() => activeState.value.isActive)
  const isExactActive = computed(() => activeState.value.isExactActive)

  function navigate(
    e: Partial<MouseEvent> = {}
  ): Promise<void | NavigationFailure> {
    if (shouldHandleLinkClick(e)) {
      // navigate() can be called without an event
      e.preventDefault?.()
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
export const RouterLink: RouterLinkI = RouterLinkImpl as any

/**
 * Typed version of the experimental `RouterLink` component.
 *
 * @internal
 */
interface RouterLinkI {
  new <Custom extends boolean | undefined = boolean | undefined>(): {
    $props: RouterLinkPropsTyped<Custom>
    $slots: {
      default?: (scope: RouterLinkSlotScope) => VNode[]
    }
  }

  /**
   * Access to `useLink()` without depending on using vue-router
   *
   * @internal
   */
  useLink: typeof useLink
}
