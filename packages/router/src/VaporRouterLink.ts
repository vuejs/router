import { routerKey } from './injectionSymbols'
import type { UseLinkReturn } from './RouterLink'
import {
  _RouterLinkI,
  getLinkClass,
  type RouterLinkProps,
  useLink,
} from './RouterLink'
import type { RouteLocationRaw } from './typed-routes'
import type { Block, PropType, UnwrapRef } from 'vue'
import {
  computed,
  createDynamicComponent,
  createPlainElement,
  defineVaporComponent,
  inject,
  reactive,
} from 'vue'

export const VaporRouterLink = defineVaporComponent({
  name: 'VaporRouterLink',
  inheritAttrs: false,
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

  slots: {} as {
    default?: ({
      route,
      href,
      isActive,
      isExactActive,
      navigate,
    }: // TODO: How do we add the name generic
    UnwrapRef<UseLinkReturn>) => Block
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
      if (props.custom && slots.default) {
        return slots.default(link)
      }
      return createPlainElement(
        'a',
        {
          'aria-current': () =>
            link.isExactActive ? props.ariaCurrentValue : null,
          href: () => link.href,
          class: () => elClass.value,
          $: [
            () => attrs,
            {
              onClick: () =>
                attrs.onClick ? [link.navigate, attrs.onClick] : link.navigate,
            },
          ],
        },
        slots.default ? { default: () => slots.default!(link) } : null
      )
    })
  },
})
