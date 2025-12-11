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
  createKeyedFragment,
  createPlainElement,
  defineVaporComponent,
  inject,
  PropType,
  reactive,
} from 'vue'

export const VaporRouterLinkImpl = defineVaporComponent({
  name: 'VaporRouterLink',
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

    const render = computed(() => {
      if (props.custom && slots.default) {
        return () => slots.default(link)
      }
      return () =>
        createPlainElement(
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
          slots
        )
    })

    return createKeyedFragment(
      () => render.value,
      () => render.value()
    )
  },
})

// @ts-ignore
VaporRouterLinkImpl.useLink = useLink

export const VaporRouterLink: _RouterLinkI = VaporRouterLinkImpl as any
