import type { NavigationInformation, RouterHistory } from './history/common'
import { historyPositions } from './history/position'
import type { RouteLocationNormalized } from './typed-routes'
import type { LocationQueryValue } from './query'

/**
 * Route fields saved with a scroll restoration navigation, without history state.
 * The params/query records and their top-level array values are copied and
 * frozen. Custom parsed objects (including array elements) keep their identity;
 * their internals are not copied or frozen.
 */
export type ScrollRestorationRoute = Readonly<
  Pick<RouteLocationNormalized, 'path' | 'fullPath' | 'name' | 'hash'>
> & {
  /**
   * Parsed parameter values. Experimental parsers can return any type, so
   * consumers must narrow values before using them. Top-level arrays are
   * detached and frozen; other parsed objects are retained by reference.
   */
  readonly params: Readonly<Record<string, unknown>>
  readonly query: Readonly<
    Record<string, LocationQueryValue | readonly LocationQueryValue[]>
  >
}

// Copy only the record and top-level array boundary. Custom parser results
// are opaque: never freeze the live route's objects or array elements.
function snapshotRouteValues<T>(
  values: Record<string, T | T[]>
): Readonly<Record<string, T | readonly T[]>> {
  const copy: Record<string, T | readonly T[]> = { ...values }
  for (const key of Object.keys(copy)) {
    const value = copy[key]
    if (Array.isArray(value)) copy[key] = Object.freeze(value.slice())
  }
  return Object.freeze(copy)
}

export function snapshotScrollRestorationRoute(
  route: RouteLocationNormalized
): ScrollRestorationRoute {
  return Object.freeze({
    path: route.path,
    fullPath: route.fullPath,
    name: route.name,
    hash: route.hash,
    params: snapshotRouteValues(route.params),
    query: snapshotRouteValues(route.query),
  })
}

/**
 * Snapshot supplied to scroll restoration callbacks. `historyPosition` belongs
 * to `route`: the departing entry during navigation capture, and the target
 * entry during restoration.
 */
export interface ScrollRestorationContext {
  /**
   * The committed operation. `initial` is a successful startup navigation;
   * history traversal is `pop`, even after an aborted startup.
   */
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
    direction: type === 'pop' ? information?.direction || '' : '',
    delta: type === 'pop' ? information?.delta || 0 : 0,
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
