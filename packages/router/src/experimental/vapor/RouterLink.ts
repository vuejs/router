import {
  createSlot,
  defineVaporComponent,
  inject,
  reactive,
  renderEffect,
  setDynamicProps,
  setInsertionState,
  template,
  type Block,
  type PropType,
} from 'vue'
import { routerKey } from '../../injectionSymbols'
import type { RouteLocationRaw } from '../../typed-routes'
import {
  type RouterLinkProps,
  type RouterLinkPropsTyped,
  type RouterLinkSlotScope,
} from '../../RouterLink'
import { useLink, type UseLinkOptions } from '../RouterLink'
import { diagnostics } from '../../diagnostics'

const t0 = /*#__PURE__*/ template('<a>', 1)

export const RouterLinkImpl = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterLink',
  // attrs are merged with the props of the `a`
  inheritAttrs: false,
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: true,
    },
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    ariaCurrentValue: {
      type: String as PropType<RouterLinkProps['ariaCurrentValue']>,
      default: 'page',
    },
    viewTransition: Boolean,
  },

  useLink,

  setup(props, { attrs }) {
    if (__DEV__ && 'custom' in attrs) {
      diagnostics.VUE_ROUTER_R0051()
    }
    // props are reactive: toValue() reads them lazily
    const link = reactive(useLink(props as UseLinkOptions))
    const { options } = inject(routerKey)!

    const a = t0() as HTMLAnchorElement
    renderEffect(() =>
      setDynamicProps(a, [
        {
          'aria-current': link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          // a user `onClick` is merged: both are called
          onClick: link.navigate,
          class: {
            [props.activeClass ??
            options.linkActiveClass ??
            'router-link-active']: link.isActive,
            [props.exactActiveClass ??
            options.linkExactActiveClass ??
            'router-link-exact-active']: link.isExactActive,
          },
        },
        attrs,
      ])
    )
    setInsertionState(a)
    createSlot('default', { $: [() => link] })
    return a
  },
})

/**
 * Vapor version of the experimental `RouterLink`. Renders a link that
 * triggers a navigation on click.
 */
export const RouterLink: RouterLinkI = RouterLinkImpl as any

/**
 * Typed version of the Vapor `RouterLink` component.
 *
 * @internal
 */
interface RouterLinkI {
  new (): {
    $props: Omit<RouterLinkPropsTyped<false>, 'custom'>
    $slots: {
      default?: (scope: RouterLinkSlotScope) => Block
    }
  }

  /**
   * Access to `useLink()` without depending on using vue-router
   *
   * @internal
   */
  useLink: typeof useLink
}
