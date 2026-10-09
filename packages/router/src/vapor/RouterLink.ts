import {
  createIf,
  createSlot,
  defineVaporComponent,
  renderEffect,
  setDynamicProps,
  setInsertionState,
  template,
  type Block,
  type UnwrapRef,
} from 'vue'
import {
  routerLinkProps,
  useLink,
  useRouterLink,
  type UseLinkReturn,
} from '../RouterLink'

const t0 = /*#__PURE__*/ template('<a>', 1)

/**
 * Vapor version of `RouterLink`. Renders a link that triggers a navigation on
 * click.
 */
export const VaporRouterLink = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterLink',
  // attrs go on the `a` and are dropped with `custom`
  inheritAttrs: false,
  props: routerLinkProps,

  slots: {} as {
    default?: (
      // TODO: How do we add the name generic
      link: UnwrapRef<UseLinkReturn>
    ) => Block
  },

  useLink,

  setup(props, { slots, attrs }) {
    const [link, elClass] = useRouterLink(props)
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
              // the user `onClick` is merged, both are called
              onClick: link.navigate,
              class: elClass.value,
            },
            // like fallthrough attrs: they take over
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
