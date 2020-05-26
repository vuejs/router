import { RouteLocationNormalized, RouteLocationNormalizedLoaded } from './types'
import { warn } from './warning'

export type ScrollPositionCoordinates = {
  /**
   * x position. 0 if not provided
   */
  x?: number
  /**
   * y position. 0 if not provided
   */
  y?: number
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
): Required<ScrollPositionCoordinates> {
  const docRect = document.documentElement.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()

  return {
    x: elRect.left - docRect.left - (offset.x || 0),
    y: elRect.top - docRect.top - (offset.y || 0),
  }
}

export const computeScrollPosition = () =>
  ({
    x: window.pageXOffset,
    y: window.pageYOffset,
  } as Required<ScrollPositionCoordinates>)

export function scrollToPosition(position: ScrollPosition): void {
  let normalizedPosition: ScrollPositionCoordinates

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
    normalizedPosition = getElementPosition(el, position.offset || {})
  } else {
    normalizedPosition = position
  }

  window.scrollTo(normalizedPosition.x || 0, normalizedPosition.y || 0)
}

export function getScrollKey(path: string, delta: number): string {
  const position: number = history.state ? history.state.position - delta : -1
  return position + path
}

export const scrollPositions = new Map<
  string,
  Required<ScrollPositionCoordinates>
>()

export function saveScrollPosition(
  key: string,
  scrollPosition: Required<ScrollPositionCoordinates>
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
