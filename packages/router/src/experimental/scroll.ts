import { diagnostics } from '../diagnostics'

/**
 * Saved position for for one property of {@link ScrollBehaviorSessionEntry}.
 * Similar to native `ScrollToOptions` but with an additional `el` property to
 * allow scrolling to a specific element on the page.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions
 */
export interface ScrollBehaviorSavedPosition {
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
 * NOTE: Intentionally declare a `default` key so auto completes gives
 * _something_ to start with.
 */

/**
 * Scroll position saved to the session history. Allows defining multiple saved
 * positions for different elements on the page.
 */
export interface ScrollBehaviorSessionEntry {
  /**
   * Default scroll position saved for the page. Use any other key to save
   * scroll positions for different elements on the page.
   */
  default?: ScrollBehaviorSavedPosition

  /**
   * Scroll positions for different elements on the page.
   */
  [id: string]: ScrollBehaviorSavedPosition | undefined
}

/**
 * Captures the current scroll position of the page using the session
 * history, the same way the legacy `scrollBehavior` implementation does.
 *
 * @returns the current scroll position or `null` if the browser handles
 * scroll restoration itself (`history.scrollRestoration !== 'manual'`)
 */
export const CAPTURE_LEGACY =
  (): NonNullable<ScrollBehaviorSavedPosition> | null =>
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
export function RESTORE_LEGACY(
  position: NonNullable<ScrollBehaviorSavedPosition>
): void {
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
            // return to avoid other warnings
            return
          }
        } catch {
          diagnostics.VUE_ROUTER_R0041({ el })
          // return to avoid other warnings
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
