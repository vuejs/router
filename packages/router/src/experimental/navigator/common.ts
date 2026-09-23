import { isBrowser } from '../../utils'
import { removeTrailingSlash } from '../../location'
import type { RouteLocationNormalized } from '../../typed-routes'

var delay = time => new Promise(resolve => setTimeout(resolve, time))

navigation.addEventListener('navigate', event => {
  console.table({
    id: event.destination.id,
    key: event.destination.key,
    type: event.navigationType,
    info: event.info,
    url: event.destination.url,
    state: event.destination.getState(),
  })

  if (!event.canIntercept) {
    console.warn('Cannot intercept navigation event', event)
    return
  }

  if (event.downloadRequest) {
    console.warn('Navigation event has download request', event)
    return
  }

  const url = new URL(event.destination.url)
  event.intercept({
    async handler() {
      // simulate loading
      const delayTime = Number(url.searchParams.get('delay')) || 1000
      console.log('🐢 navigating with delay of', delayTime, 'ms')
      await delay(delayTime)

      if (url.searchParams.get('cancel')) {
        event.preventDefault()
        return
      }
    },
    focusReset: 'after-transition',
    scroll: 'after-transition',
  })
})

navigation.navigate('/', {
  history: 'auto',
  info: { scroll: false },
  state: {},
})

/**
 * Scroll coordinates
 *
 * @internal
 */
export type ScrollCoordinates = {
  left: number
  top: number
}

export const SCROLL_SAVE_DEFAULT = (): ScrollCoordinates => ({
  left: window.scrollX,
  top: window.scrollY,
})

export interface RouterNavigatorScroll<ScrollData = unknown> {
  /**
   * Computes the key associated with the scroll position. Reuse a key to
   * preserve a scroll position across navigations.
   */
  key?: (to: RouteLocationNormalized) => string

  capture?: () => ScrollData

  restore?: (data: ScrollData) => void
}

const ROUTER_NAVIGATOR_SCROLL_DEFAULT: RouterNavigatorScroll<ScrollCoordinates> =
  {
    key: to => to.fullPath,

    capture: () => ({ left: window.scrollX, top: window.scrollY }),

    restore: data => {
      window.scrollTo(data)
    },
  }

export interface RouterNavigator {
  scroll?: NavigationScrollBehavior | RouterNavigatorScroll

  getState(): unknown

  navigate(url: string, options?: NavigationOptions): void
}

/// OLD CODE BELOW ///

export type HistoryLocation = string
/**
 * Allowed variables in HTML5 history state. Note that pushState clones the state
 * passed and does not accept everything: e.g.: it doesn't accept symbols, nor
 * functions as values. It also ignores Symbols as keys.
 *
 * @internal
 */
export type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | HistoryState
  | HistoryStateArray

/**
 * Allowed HTML history.state
 */
export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}

/**
 * Allowed arrays for history.state.
 *
 * @internal
 */
export interface HistoryStateArray extends Array<HistoryStateValue> {}

export enum NavigationType {
  pop = 'pop',
  push = 'push',
}

export enum NavigationDirection {
  back = 'back',
  forward = 'forward',
  unknown = '',
}

export interface NavigationInformation {
  type: NavigationType
  direction: NavigationDirection
  delta: number
}

export interface NavigationCallback {
  (
    to: HistoryLocation,
    from: HistoryLocation,
    information: NavigationInformation
  ): void
}

/**
 * Starting location for Histories
 */
export const START: HistoryLocation = ''

export type ValueContainer<T> = { value: T }

/**
 * Interface implemented by History implementations that can be passed to the
 * router as {@link Router.history}
 *
 * @alpha
 */
export interface RouterHistory {
  /**
   * Base path that is prepended to every url. This allows hosting an SPA at a
   * sub-folder of a domain like `example.com/sub-folder` by having a `base` of
   * `/sub-folder`
   */
  readonly base: string
  /**
   * Current History location
   */
  readonly location: HistoryLocation
  /**
   * Current History state
   */
  readonly state: HistoryState
  // readonly location: ValueContainer<HistoryLocationNormalized>

  /**
   * Navigates to a location. In the case of an HTML5 History implementation,
   * this will call `history.pushState` to effectively change the URL.
   *
   * @param to - location to push
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  push(to: HistoryLocation, data?: HistoryState): void
  /**
   * Same as {@link RouterHistory.push} but performs a `history.replaceState`
   * instead of `history.pushState`
   *
   * @param to - location to set
   * @param data - optional {@link HistoryState} to be associated with the
   * navigation entry
   */
  replace(to: HistoryLocation, data?: HistoryState): void

  /**
   * Traverses history in a given direction.
   *
   * @example
   * ```js
   * myHistory.go(-1) // equivalent to window.history.back()
   * myHistory.go(1) // equivalent to window.history.forward()
   * ```
   *
   * @param delta - distance to travel. If delta is \< 0, it will go back,
   * if it's \> 0, it will go forward by that amount of entries.
   * @param triggerListeners - whether this should trigger listeners attached to
   * the history
   */
  go(delta: number, triggerListeners?: boolean): void

  /**
   * Attach a listener to the History implementation that is triggered when the
   * navigation is triggered from outside (like the Browser back and forward
   * buttons) or when passing `true` to {@link RouterHistory.back} and
   * {@link RouterHistory.forward}
   *
   * @param callback - listener to attach
   * @returns a callback to remove the listener
   */
  listen(callback: NavigationCallback): () => void

  /**
   * Generates the corresponding href to be used in an anchor tag.
   *
   * @param location - history location that should create an href
   */
  createHref(location: HistoryLocation): string

  /**
   * Clears any event listener attached by the history implementation.
   */
  destroy(): void
}

// Generic utils

/**
 * Normalizes a base by removing any trailing slash and reading the base tag if
 * present.
 *
 * @param base - base to normalize
 */
export function normalizeBase(base?: string): string {
  if (!base) {
    if (isBrowser) {
      // respect <base> tag
      const baseEl = document.querySelector('base')
      base = (baseEl && baseEl.getAttribute('href')) || '/'
      // strip full URL origin
      base = base.replace(/^\w+:\/\/[^/]+/, '')
    } else {
      base = '/'
    }
  }

  // ensure leading slash when it was removed by the regex above avoid leading
  // slash with hash because the file could be read from the disk like file://
  // and the leading slash would cause problems
  if (base[0] !== '/' && base[0] !== '#') base = '/' + base

  // remove the trailing slash so all other method can just do `base + fullPath`
  // to build an href
  return removeTrailingSlash(base)
}

// remove any character before the hash
const BEFORE_HASH_RE = /^[^#]+#/
export function createHref(base: string, location: HistoryLocation): string {
  return base.replace(BEFORE_HASH_RE, '#') + location
}
