import {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  _RouteLocationBase,
} from './types'
import { warn } from './warning'

// we use types instead of interfaces to make it work with HistoryStateValue type

/**
 * Scroll position similar to
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/ScrollToOptions | `ScrollToOptions`}.
 * Note that not all browsers support `behavior`.
 */
export type ScrollPositionCoordinates = {
  behavior?: ScrollOptions['behavior']
  left?: number
  top?: number
}

/**
 * Internal normalized version of {@link ScrollPositionCoordinates} that always
 * has `left` and `top` coordinates.
 *
 * @internal
 */
export type _ScrollPositionNormalized = {
  behavior?: ScrollOptions['behavior']
  left: number
  top: number
}

export interface ScrollPositionElement {
  /**
   * A simple _id_ selector with a leading `#` or a valid CSS selector **not starting** with a `#`.
   * @example
   * Here are a few examples:
   *
   * - `.title`
   * - `.content:first-child`
   * - `#marker`
   * - `#marker~with~symbols`
   * - `#marker.with.dot`: selects `id="marker.with.dot"`, not `class="with dot" id="marker"`
   *
   */
  selector: string
  /**
   * Relative offset to the `selector` in {@link ScrollPositionCoordinates}
   */
  offset?: ScrollPositionCoordinates
}

export type ScrollPosition = ScrollPositionCoordinates | ScrollPositionElement

type Awaitable<T> = T | PromiseLike<T>

export interface ScrollBehaviorHandler<T> {
  (
    to: RouteLocationNormalized,
    from: RouteLocationNormalizedLoaded,
    savedPosition: T | void
  ): Awaitable<ScrollPosition | false | void>
}

function getElementPosition(
  el: Element,
  offset: ScrollPositionCoordinates
): _ScrollPositionNormalized {
  const docRect = document.documentElement.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  return {
    behavior: offset.behavior,
    left: elRect.left - docRect.left - (offset.left || 0),
    top: elRect.top - docRect.top - (offset.top || 0),
  }
}

export const computeScrollPosition = () =>
  ({
    left: window.pageXOffset,
    top: window.pageYOffset,
  } as _ScrollPositionNormalized)

export function scrollToPosition(position: ScrollPosition): void {
  let scrollToOptions: ScrollPositionCoordinates

  if ('selector' in position) {
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
      try {
        document.querySelector(position.selector)
      } catch {
        warn(
          `The selector "${position.selector}" is invalid. If you are using an id selector, make sure to escape it. You can find more information about escaping characters in selectors at https://mathiasbynens.be/notes/css-escapes.`
        )
      }
    }

    const el = document.querySelector(position.selector)

    if (!el) {
      __DEV__ &&
        warn(`Couldn't find element with selector "${position.selector}"`)
      return
    }
    scrollToOptions = getElementPosition(el, position.offset || {})
  } else {
    scrollToOptions = position
  }

  if ('scrollBehavior' in document.documentElement.style)
    window.scrollTo(scrollToOptions)
  else window.scrollTo(scrollToOptions.left || 0, scrollToOptions.top || 0)
}

export function getScrollKey(path: string, delta: number): string {
  const position: number = history.state ? history.state.position - delta : -1
  return position + path
}

export const scrollPositions = new Map<string, _ScrollPositionNormalized>()

export function saveScrollPosition(
  key: string,
  scrollPosition: _ScrollPositionNormalized
) {
  scrollPositions.set(key, scrollPosition)
}

export function getSavedScrollPosition(key: string) {
  const scroll = scrollPositions.get(key)
  // consume it so it's not used again
  scrollPositions.delete(key)
  return scroll
}

// TODO: RFC about how to save scroll position
/**
 * ScrollBehavior instance used by the router to compute and restore the scroll
 * position when navigating.
 */
// export interface ScrollHandler<T> {
//   compute(): T
//   scroll(position: T): void
// }

// export const scrollHandler: ScrollHandler<ScrollPosition> = {
//   compute: computeScroll,
//   scroll: scrollToPosition,
// }
