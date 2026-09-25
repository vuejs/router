import type { App, FunctionPlugin, InjectionKey, MaybeRefOrGetter } from 'vue'
import {
  inject,
  onActivated,
  onBeforeMount,
  onDeactivated,
  onUnmounted,
  toValue,
} from 'vue'
import { diagnostics } from '../diagnostics'
import { START_LOCATION_NORMALIZED } from '../location'
import type { RouteLocationNormalized, RouteMap } from '../typed-routes'
import type { Router } from '../router'
import { noop, toValueWithArgs } from '../utils'
import type { EXPERIMENTAL_Router } from './router'
import { onRouteRendered } from './on-route-rendered'

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
 * Scroll positions saved to `sessionStorage`. The explicit `default` key
 * provides an autocomplete suggestion, while other keys allow multiple named
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
 * Captures the current window scroll position, the same way the legacy
 * `scrollBehavior` implementation does.
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
 * Scrolls the page to a saved position, the same way the legacy
 * `scrollBehavior` implementation does.
 *
 * @param position - the position to scroll to
 */
export function RESTORE_LEGACY(position: ScrollRestorationPosition = {}): void {
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

  window.scrollTo(scrollToOptions)
}

/**
 * Options for the {@link ScrollRestoration} plugin.
 */
export interface ScrollRestorationPluginOptions extends UseScrollRestorationOptions {
  /**
   * Router instance, must be passed because this plugin is installed before
   * the router.
   */
  router: EXPERIMENTAL_Router | Router

  /**
   * Prefix used for entries written to `sessionStorage`.
   *
   * @defaultValue `vue:scroll:`
   */
  storageKeyPrefix?: string

  capture: NonNullable<UseScrollRestorationOptions['capture']>
  restore: NonNullable<UseScrollRestorationOptions['restore']>
}

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
   * All calls with the same key share one saved entry. Calls active at the
   * same time should use different keys, one per scroll container: with the
   * same key, each one captures and restores, and the last capture wins.
   */
  key?: string | ((to: RouteLocationNormalized<Name>) => string)

  /**
   * Synchronously captures all positions that must be saved for this page.
   * Returning `null` removes the previously saved entry.
   */
  capture?: () => ScrollRestorationSessionEntry | null

  /**
   * Synchronously restores all positions previously returned by `capture`.
   * Unless `manual` is enabled, it runs after each navigation, once the new
   * route is displayed
   *
   * @see {@link onRouteRendered}
   */
  restore?: (entry: ScrollRestorationSessionEntry | null | undefined) => void

  /**
   * If this resolves to true, the returned `scroll()` must be manually invoked
   * to restore the scroll. Capture still happens automatically. This is useful
   * when the content is not displayed immediately after navigation, for
   * example when using an animation or a virtualized list.
   */
  manual?: MaybeRefOrGetter<boolean>
}

// NOTE: smaller and perf because one shared variable
let defaultCapturePosition: ScrollRestorationPosition | null

/**
 * Default capture function that captures the current window scroll position.
 * Can be passed to {@link ScrollRestoration} to use the legacy scroll behavior
 * from v5.
 *
 * @see {@link ScrollRestoration}
 */
export const SCROLL_RESTORATION_CAPTURE_DEFAULT =
  (): ScrollRestorationSessionEntry | null => (
    (defaultCapturePosition = CAPTURE_LEGACY()),
    defaultCapturePosition && { default: defaultCapturePosition }
  )

/**
 * Default restore function that restores the saved window scroll position.
 * Can be passed to {@link ScrollRestoration} to use the legacy scroll behavior
 * from v5.
 *
 * @see {@link ScrollRestoration}
 */
export const SCROLL_RESTORATION_RESTORE_DEFAULT = (
  entry: ScrollRestorationSessionEntry | null | undefined
): void => RESTORE_LEGACY(entry?.default)

const SCROLL_RESTORATION_REGISTRATIONS: InjectionKey<
  [
    registrations: Set<Required<UseScrollRestorationOptions>>,
    restore: (
      options: Required<UseScrollRestorationOptions>,
      to?: RouteLocationNormalized
    ) => void,
  ]
> = Symbol()

const SCROLL_RESTORATION_PLUGIN_OPTIONS_DEFAULTS: Required<
  Omit<
    ScrollRestorationPluginOptions,
    | 'router'
    // required settings
    | 'capture'
    | 'restore'
  >
> = {
  storageKeyPrefix: 'vue:scroll:',
  // these should be passed by the user
  // capture: SCROLL_RESTORATION_CAPTURE_DEFAULT,
  // restore: SCROLL_RESTORATION_RESTORE_DEFAULT,
  key: to => to.path + to.hash,
  manual: false,
}

const SCROLL_RESTORATION_OPTIONS_KEY: InjectionKey<
  Required<ScrollRestorationPluginOptions>
> = Symbol()

/**
 * Enables component-owned scroll restoration backed by `sessionStorage`.
 * Sets `history.scrollRestoration` to `manual` when `document` is defined, is
 * a noop otherwise (SSR).
 *
 * Must be installedb before the router, and the router must be passed in the options.
 *
 * ```ts
 * app.use(ScrollRestoration, { router })
 * app.use(router)
 * ```
 */
export const ScrollRestoration: FunctionPlugin<
  [options: ScrollRestorationPluginOptions]
> = typeof document === 'undefined' ? noop : ScrollRestorationClient

// dev only map to warn on wrong usage
let devTrackedCapturedOptions:
  | Map<string, Required<UseScrollRestorationOptions>>
  | undefined

function ScrollRestorationClient(
  app: App,
  options: ScrollRestorationPluginOptions
): void {
  const optionsWithDefaults = {
    ...SCROLL_RESTORATION_PLUGIN_OPTIONS_DEFAULTS,
    ...options,
  }
  const { storageKeyPrefix, router } = optionsWithDefaults

  app.provide(SCROLL_RESTORATION_OPTIONS_KEY, optionsWithDefaults)
  const registrations = new Set<Required<UseScrollRestorationOptions>>()
  history.scrollRestoration = 'manual'

  function restoreScroll(
    { restore, key }: Required<UseScrollRestorationOptions>,
    to: RouteLocationNormalized = router.currentRoute.value
  ) {
    let entry: ScrollRestorationSessionEntry | null | undefined
    let value: string | undefined | null
    // using the sessionStorage can fail in many ways (security, quota, etc.), so we ignore any errors
    try {
      entry =
        (value = sessionStorage[storageKeyPrefix + toValueWithArgs(key, to)]) &&
        JSON.parse(value)
    } catch {}
    restore(entry)
  }

  app.provide(SCROLL_RESTORATION_REGISTRATIONS, [registrations, restoreScroll])

  function capture(route: RouteLocationNormalized) {
    // track for dev warnings
    if (__DEV__) {
      devTrackedCapturedOptions = new Map()
    }
    for (const registration of registrations) {
      const key = storageKeyPrefix + toValueWithArgs(registration.key, route)
      if (__DEV__) {
        const other = devTrackedCapturedOptions!.get(key)
        // same key with the defaults is harmless: same values
        if (
          other &&
          (other.capture !== registration.capture ||
            other.restore !== registration.restore)
        ) {
          diagnostics.VUE_ROUTER_R0043({
            key: key.slice(storageKeyPrefix.length),
          })
        }
        devTrackedCapturedOptions!.set(key, registration)
      }
      const entry = registration.capture()
      try {
        if (entry) sessionStorage[key] = JSON.stringify(entry)
        else delete sessionStorage[key]
        // blocked storage, full quota, or unserializable entry
      } catch {}
    }
  }

  // TODO: is this the right way? capturing on unmount within the composable seems safer
  // the DOM still shows `from` until the next render flush
  const removeAfterEach = router.afterEach((_to, from, failure) => {
    if (!failure && from !== START_LOCATION_NORMALIZED) capture(from)
  })
  const listenersController = new AbortController()
  const captureOnPageHide = () => capture(router.currentRoute.value)
  // a hidden page can be killed without pagehide
  window.addEventListener('pagehide', captureOnPageHide, {
    signal: listenersController.signal,
  })
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') captureOnPageHide()
    },
    {
      signal: listenersController.signal,
    }
  )

  app.onUnmount(() => {
    removeAfterEach()
    listenersController.abort()
  })
}

/**
 * Returned value of {@link useScrollRestoration}
 *
 * @see {@link useScrollRestoration}
 */
export interface UseScrollRestorationReturns {
  /**
   * Invokes the restoration of scroll. Usually combined with `manual: true`
   */
  scroll: () => void
}

/**
 * Registers scroll capture and restoration for the current component.
 *
 * @returns a `scroll` function that manually restores the saved entry
 */
export const useScrollRestoration: <
  Name extends keyof RouteMap = keyof RouteMap,
>(
  options?: UseScrollRestorationOptions<Name>
) => UseScrollRestorationReturns =
  typeof document === 'undefined'
    ? useScrollRestorationSSR
    : useScrollRestorationClient

function useScrollRestorationSSR(): UseScrollRestorationReturns {
  return { scroll: noop }
}

function useScrollRestorationClient<
  Name extends keyof RouteMap = keyof RouteMap,
>(options?: UseScrollRestorationOptions<Name>): UseScrollRestorationReturns {
  // const context = inject(SCROLL_RESTORATION)
  const [registrations, restore] = inject(SCROLL_RESTORATION_REGISTRATIONS)!
  if (__DEV__ && !registrations) {
    throw new Error(
      'useScrollRestoration() requires installing the ScrollRestoration plugin'
    )
  }
  const globalOptions = inject(SCROLL_RESTORATION_OPTIONS_KEY)!
  const optionsWithDefaults = { ...globalOptions, ...options }

  const add = () => registrations.add(optionsWithDefaults)
  const remove = () => registrations.delete(optionsWithDefaults)

  // not in setup() so a component that never mounts can't capture
  onBeforeMount(add)
  // a component cached by KeepAlive must not capture another page
  onActivated(add)
  onDeactivated(remove)
  onUnmounted(remove)

  onRouteRendered(to => {
    if (!toValue(optionsWithDefaults.manual)) {
      if (registrations.has(optionsWithDefaults)) {
        restore(optionsWithDefaults, to)
      }
    }
  })

  return {
    scroll: () => restore(optionsWithDefaults),
  }
}
