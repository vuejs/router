import { routerKey } from './injectionSymbols'
import {
  _RouterLinkI,
  getLinkClass,
  type RouterLinkProps,
  useLink,
} from './RouterLink'
import { RouteLocationRaw } from './typed-routes'
import {
  computed,
  createComponentWithFallback,
  createDynamicComponent,
  defineVaporComponent,
  inject,
  PropType,
  reactive,
} from 'vue'

export const VaporRouterLinkImpl = /*#__PURE__*/ defineVaporComponent({
  name: 'RouterLink',
  // @ts-ignore
  compatConfig: { MODE: 3 },
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: true,
    },
    replace: Boolean,
    activeClass: String,
    // inactiveClass: String,
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
    const link = reactive(useLink(props))
    const { options } = inject(routerKey)!

    const elClass = computed(() => ({
      [getLinkClass(
        props.activeClass,
        options.linkActiveClass,
        'router-link-active'
      )]: link.isActive,
      // [getLinkClass(
      //   props.inactiveClass,
      //   options.linkInactiveClass,
      //   'router-link-inactive'
      // )]: !link.isExactActive,
      [getLinkClass(
        props.exactActiveClass,
        options.linkExactActiveClass,
        'router-link-exact-active'
      )]: link.isExactActive,
    }))

    return createDynamicComponent(() => {
      const children = slots.default && slots.default(link)
      return props.custom
        ? () => children
        : () =>
            createComponentWithFallback(
              'a',
              {
                'aria-current': () =>
                  link.isExactActive ? props.ariaCurrentValue : null,
                href: () => link.href,
                // this would override user added attrs but Vue will still add
                // the listener, so we end up triggering both
                onClick: () => link.navigate,
                class: () => elClass.value,
                $: [() => attrs],
              },
              {
                default: () => children,
              }
            )
    })
  },
})

export const VaporRouterLink: _RouterLinkI = VaporRouterLinkImpl as any
