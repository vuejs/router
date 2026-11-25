import type { NavigationInformation, RouterHistory } from './history/common'
import { historyPositions } from './history/position'
import type { RouteLocationNormalized } from './typed-routes'

/** Route fields saved with a scroll restoration navigation, without history state. */
export type ScrollRestorationRoute = Readonly<
  Pick<
    RouteLocationNormalized,
    'path' | 'fullPath' | 'name' | 'hash' | 'params' | 'query'
  >
>

export function snapshotScrollRestorationRoute(
  route: RouteLocationNormalized
): ScrollRestorationRoute {
  return Object.freeze({
    path: route.path,
    fullPath: route.fullPath,
    name: route.name,
    hash: route.hash,
    params: { ...route.params },
    query: { ...route.query },
  })
}

/**
 * Snapshot supplied to scroll restoration callbacks. `historyPosition` belongs
 * to `route`: the departing entry during navigation capture, and the target
 * entry during restoration.
 */
export interface ScrollRestorationContext {
  /** The committed operation. `initial` includes loading or reloading the app. */
  readonly type: 'initial' | 'push' | 'replace' | 'pop'
  /** Traversal direction, or an empty string for other navigations. */
  readonly direction: 'back' | 'forward' | ''
  /** Distance traveled for a pop navigation, otherwise zero. */
  readonly delta: number
  /** Snapshot of the route whose position is captured or restored. */
  readonly route: ScrollRestorationRoute
  /** Snapshot of the route left by this navigation. */
  readonly from: ScrollRestorationRoute
  /** Snapshot of the route entered by this navigation. */
  readonly to: ScrollRestorationRoute
  /**
   * Stack position for built-in memory, web and hash histories. Preserved on
   * replace and browser reload; undefined for custom histories. Positions can
   * be reused after discarding the forward branch, so this is not a unique ID.
   */
  readonly historyPosition: number | undefined
}

const contexts = new WeakMap<
  RouteLocationNormalized,
  ScrollRestorationContext
>()

export function getScrollRestorationContext(
  route: RouteLocationNormalized
): ScrollRestorationContext | undefined {
  return contexts.get(route)
}

// Called only after a navigation passes its final cancellation check and its
// history operation succeeds. No shared pending-navigation flags are needed.
export function recordScrollRestorationContext(
  history: RouterHistory,
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  type: ScrollRestorationContext['type'],
  information?: NavigationInformation
): void {
  const fromPosition = contexts.get(from)?.historyPosition
  const position = historyPositions.get(history)?.()
  // Do not retain other WeakMap keys through from/to: keeping an old route
  // must not retain every subsequent navigation (or the entire past).
  const fromSnapshot = snapshotScrollRestorationRoute(from)
  const toSnapshot = snapshotScrollRestorationRoute(to)
  const navigation = {
    type,
    direction: information?.direction || '',
    delta: information?.delta || 0,
    from: fromSnapshot,
    to: toSnapshot,
  } as const
  contexts.set(
    from,
    Object.freeze({
      ...navigation,
      route: fromSnapshot,
      historyPosition: fromPosition,
    })
  )
  contexts.set(
    to,
    Object.freeze({
      ...navigation,
      route: toSnapshot,
      historyPosition: position,
    })
  )
}
