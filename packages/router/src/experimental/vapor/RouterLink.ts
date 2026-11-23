import {
  createIf,
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

const t0 = /*#__PURE__*/ template('<a>', 1)

export const RouterLinkImpl = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterLink',
  // attrs go on the `a` and are dropped with `custom`
  inheritAttrs: false,
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

  setup(props, { slots, attrs }) {
    // props are reactive: toValue() reads them lazily
    const link = reactive(useLink(props as UseLinkOptions))
    const { options } = inject(routerKey)!

    return createIf(
      () => props.custom,
      // not a slot outlet so directives apply to its root (#2375)
      () => (slots.default ? slots.default(link) : []),
      () => {
        const a = t0() as HTMLAnchorElement
        renderEffect(() =>
          setDynamicProps(a, [
            {
              'aria-current': link.isExactActive
                ? props.ariaCurrentValue
                : null,
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
      }
    )
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
  new <Custom extends boolean | undefined = boolean | undefined>(): {
    $props: RouterLinkPropsTyped<Custom>
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
