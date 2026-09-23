import type {
  ComponentInternalInstance,
  FunctionPlugin,
  InjectionKey,
} from 'vue'
import { getCurrentInstance, inject, onMounted, onUpdated } from 'vue'
import { diagnostics } from '../diagnostics'
import type { RouteLocationNormalized, RouteMap } from '../typed-routes'
import type { Router } from '../router'
import { useRouter } from '../useApi'
import type { EXPERIMENTAL_Router } from './router'

/**
 * Saved position for one property of {@link ScrollRestorationSessionEntry}.
 * Similar to native `ScrollToOptions` but with an additional `el` property to
 * allow scrolling to a specific element on the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions
 */
export interface ScrollRestorationPosition {
  /**
   * A valid CSS selector. Note some characters must be escaped in id
   * selectors (https://mathiasbynens.be/notes/css-escapes).
   *
   * Here are a few examples:
   *
   * - `.title`
   * - `.content:first-child`
   * - `#marker`
   * - `#marker\~with\~symbols`
   * - `#marker.with.dot`: selects `class="with dot" id="marker"`, not
   *   `id="marker.with.dot"`
   */
  el?: string

  /**
   * Top offset in pixels to scroll to. If `el` is provided, this is the offset
   * from the top of the element.
   */
  top?: number

  /**
   * Left offset in pixels to scroll to. If `el` is provided, this is the
   * offset from the left of the element.
   */
  left?: number

  /**
   * Defines the transition animation. Defaults to `auto`.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions/behavior
   */
  behavior?: ScrollBehavior
}

/**
 * Scroll positions saved to the session history. The explicit `default` key
 * provides an autocomplete suggestion, while other keys allow multiple saved
 * positions for the page.
 */
export interface ScrollRestorationSessionEntry {
  /**
   * Default scroll position saved for the page.
   */
  default?: ScrollRestorationPosition

  /**
   * Scroll positions for different elements on the page.
   */
  [id: string]: ScrollRestorationPosition | undefined
}

/**
 * Captures the current scroll position of the page using the session
 * history, the same way the legacy `scrollBehavior` implementation does.
 *
 * @returns the current scroll position or `null` if the browser handles
 * scroll restoration itself (`history.scrollRestoration !== 'manual'`)
 */
export const CAPTURE_LEGACY = (): ScrollRestorationPosition | null =>
  history.scrollRestoration === 'manual'
    ? {
        left: window.scrollX,
        top: window.scrollY,
      }
    : null

/**
 * Scrolls the page to a saved position using the session history, the same
 * way the legacy `scrollBehavior` implementation does.
 *
 * @param position - the position to scroll to
 */
export function RESTORE_LEGACY(position: ScrollRestorationPosition): void {
  let scrollToOptions: ScrollToOptions

  if (position.el) {
    const { el } = position
    const isIdSelector = el.startsWith('#')
    /**
     * `id`s can accept pretty much any characters, including CSS combinators
     * like `>` or `~`. It's still possible to retrieve elements using
     * `document.getElementById('~')` but it needs to be escaped when using
     * `document.querySelector('#\\~')` for it to be valid. The only
     * requirements for `id`s are them to be unique on the page and to not be
     * empty (`id=""`). Because of that, when passing an id selector, it should
     * be properly escaped for it to work with `querySelector`. We could check
     * for the id selector to be simple (no CSS combinators `+ >~`) but that
     * would make things inconsistent since they are valid characters for an
     * `id` but would need to be escaped when using `querySelector`, breaking
     * their usage and ending up in no selector returned. Selectors need to be
     * escaped:
     *
     * - `#1-thing` becomes `#\31 -thing`
     * - `#with~symbols` becomes `#with\\~symbols`
     *
     * - More information about  the topic can be found at
     *   https://mathiasbynens.be/notes/html5-id-class.
     * - Practical example: https://mathiasbynens.be/demo/html5-id
     */
    if (__DEV__) {
      if (!isIdSelector || !document.getElementById(el.slice(1))) {
        try {
          const foundEl = document.querySelector(el)
          if (isIdSelector && foundEl) {
            diagnostics.VUE_ROUTER_R0040({ el })
            return
          }
        } catch {
          diagnostics.VUE_ROUTER_R0041({ el })
          return
        }
      }
    }

    const foundEl = isIdSelector
      ? document.getElementById(el.slice(1))
      : document.querySelector(el)

    if (!foundEl) {
      __DEV__ && diagnostics.VUE_ROUTER_R0042({ el })
      return
    }

    const docRect = document.documentElement.getBoundingClientRect()
    const elRect = foundEl.getBoundingClientRect()

    scrollToOptions = {
      behavior: position.behavior,
      left: elRect.left - docRect.left - (position.left || 0),
      top: elRect.top - docRect.top - (position.top || 0),
    }
  } else {
    scrollToOptions = position
  }

  if ('scrollBehavior' in document.documentElement.style)
    window.scrollTo(scrollToOptions)
  else {
    window.scrollTo(
      scrollToOptions.left != null ? scrollToOptions.left : window.scrollX,
      scrollToOptions.top != null ? scrollToOptions.top : window.scrollY
    )
  }
}

export interface ScrollRestorationPluginOptions {
  router: EXPERIMENTAL_Router | Router
}

const HAS_PENDING_SCROLL_RESTORATION: InjectionKey<
  Map<string, Set<ComponentInternalInstance>>
> = Symbol(/* 'HAS_PENDING_SCROLL_RESTORATION' */)

export const ScrollRestoration: FunctionPlugin<
  [options: ScrollRestorationPluginOptions]
> = (app, { router }) => {
  window.history.scrollRestoration = 'manual'

  const activatedInstances = new Map<string, Set<ComponentInternalInstance>>()
  app.provide(HAS_PENDING_SCROLL_RESTORATION, activatedInstances)

  const removeAfterEach = router.afterEach((to, from) => {
    console.log('🚗 After each', from.fullPath, '->', to.fullPath)
    activatedInstances.clear()
  })

  app.onUnmount(removeAfterEach)
}

export const USE_SCROLL_RESTORATION_DEFAULTS = {
  key: (to: RouteLocationNormalized) => to.path + to.hash,
} satisfies UseScrollRestorationOptions

/**
 * Options for `useScrollRestoration()`.
 *
 * @see {@link useScrollRestoration}
 */
export interface UseScrollRestorationOptions<
  Name extends keyof RouteMap = keyof RouteMap,
> {
  /**
   * A key, derived from the route, that is used to store the scroll position.
   * By default, the key is the route's path + hash, meaning going from
   * `/search?q=shoes` to `/search?q=shirts` will reuse the scroll position,
   * but going from `/search?q=shoes` to `/search?q=shoes#anchor` will not.
   * Nested `useScrollRestoration()` calls with the same key will **take over**
   * ancestor calls and completely **override** their scroll restoration
   * behavior.
   */
  key?: string | ((to: RouteLocationNormalized<Name>) => string)

  /**
   * If true, the user must call the returned `scroll()` to trigger the scroll
   * restoration. Useful when the displayed content is not displayed immediately
   * after the navigation, for example when using an animation or a virtualized
   * list.
   */
  manual?: boolean
}

export function useScrollRestoration<
  Name extends keyof RouteMap = keyof RouteMap,
>(options?: UseScrollRestorationOptions<Name>) {
  const router = useRouter()
  const instance = getCurrentInstance()!
  if (__DEV__ && !instance) {
    throw new Error(
      'TODO: useScrollRestoration() must be called in setup() of a component'
    )
  }
  const scrollActivationMap = inject(HAS_PENDING_SCROLL_RESTORATION)!

  const key = options?.key ?? USE_SCROLL_RESTORATION_DEFAULTS.key

  function triggerScrollRestoration() {
    const keyValue =
      typeof key === 'function' ? key(router.currentRoute.value) : key
    let activatedInstances = scrollActivationMap.get(keyValue)
    if (!activatedInstances) {
      scrollActivationMap.set(keyValue, (activatedInstances = new Set()))
    }
    if (!activatedInstances.has(instance)) {
      console.log(
        '♻️ Restoring scroll position for',
        router.currentRoute.value.fullPath
      )
      activatedInstances.add(instance)
    }
  }

  // ensure that we trigger when the component is reused or not
  onMounted(triggerScrollRestoration)
  onUpdated(triggerScrollRestoration)

  return {
    scroll: triggerScrollRestoration,
  }
}
