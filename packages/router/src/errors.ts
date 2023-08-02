import {
  MatcherLocationRaw,
  MatcherLocation,
  RouteLocationRaw,
  RouteLocationNormalized,
} from './types'
import { assign } from './utils'

/**
 * Flags so we can combine them when checking for multiple errors. This is the internal version of
 * {@link NavigationFailureType}.
 *
 * @internal
 */
export const enum ErrorTypes {
  // they must be literals to be used as values, so we can't write
  // 1 << 2
  MATCHER_NOT_FOUND = 1,
  NAVIGATION_GUARD_REDIRECT = 2,
  NAVIGATION_ABORTED = 4,
  NAVIGATION_CANCELLED = 8,
  NAVIGATION_DUPLICATED = 16,
}

const NavigationFailureSymbol = Symbol(__DEV__ ? 'navigation failure' : '')

export interface MatcherError extends Error {
  type: ErrorTypes.MATCHER_NOT_FOUND
  location: MatcherLocationRaw
  currentLocation?: MatcherLocation
}

/**
 * Enumeration with all possible types for navigation failures. Can be passed to
 * {@link isNavigationFailure} to check for specific failures.
 */
export enum NavigationFailureType {
  /**
   * An aborted navigation is a navigation that failed because a navigation
   * guard returned `false` or called `next(false)`
   */
  aborted = ErrorTypes.NAVIGATION_ABORTED,
  /**
   * A cancelled navigation is a navigation that failed because a more recent
   * navigation finished started (not necessarily finished).
   */
  cancelled = ErrorTypes.NAVIGATION_CANCELLED,
  /**
   * A duplicated navigation is a navigation that failed because it was
   * initiated while already being at the exact same location.
   */
  duplicated = ErrorTypes.NAVIGATION_DUPLICATED,
}

/**
 * Extended Error that contains extra information regarding a failed navigation.
 */
export interface NavigationFailure extends Error {
  /**
   * Type of the navigation. One of {@link NavigationFailureType}
   */
  type:
    | ErrorTypes.NAVIGATION_CANCELLED
    | ErrorTypes.NAVIGATION_ABORTED
    | ErrorTypes.NAVIGATION_DUPLICATED
  /**
   * Route location we were navigating from
   */
  from: RouteLocationNormalized
  /**
   * Route location we were navigating to
   */
  to: RouteLocationNormalized
}

/**
 * Internal error used to detect a redirection.
 *
 * @internal
 */
export interface NavigationRedirectError
  extends Omit<NavigationFailure, 'to' | 'type'> {
  type: ErrorTypes.NAVIGATION_GUARD_REDIRECT
  to: RouteLocationRaw
}

// DEV only debug messages
const ErrorTypeMessages = {
  [ErrorTypes.MATCHER_NOT_FOUND]({ location, currentLocation }: MatcherError) {
    return `No match for\n ${JSON.stringify(location)}${
      currentLocation
        ? '\nwhile being at\n' + JSON.stringify(currentLocation)
        : ''
    }`
  },
  [ErrorTypes.NAVIGATION_GUARD_REDIRECT]({
    from,
    to,
  }: NavigationRedirectError) {
    return `Redirected from "${from.fullPath}" to "${stringifyRoute(
      to
    )}" via a navigation guard.`
  },
  [ErrorTypes.NAVIGATION_ABORTED]({ from, to }: NavigationFailure) {
    return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`
  },
  [ErrorTypes.NAVIGATION_CANCELLED]({ from, to }: NavigationFailure) {
    return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`
  },
  [ErrorTypes.NAVIGATION_DUPLICATED]({ from, to }: NavigationFailure) {
    return `Avoided redundant navigation to current location: "${from.fullPath}".`
  },
}

// Possible internal errors
type RouterError = NavigationFailure | NavigationRedirectError | MatcherError

export function createRouterError<E extends RouterError>(
  type: E['type'],
  params: Omit<E, 'type' | keyof Error>
): E {
  // keep full error messages in cjs versions
  if (__DEV__ || !__BROWSER__) {
    return assign(
      new Error(ErrorTypeMessages[type](params as any)),
      {
        type,
        [NavigationFailureSymbol]: true,
      } as { type: typeof type },
      params
    ) as E
  } else {
    return assign(
      new Error(),
      {
        type,
        [NavigationFailureSymbol]: true,
      } as { type: typeof type },
      params
    ) as E
  }
}

/**
 * Check if an object is a {@link NavigationFailure}.
 *
 * @param error - possible {@link NavigationFailure}
 * @param type - optional types to check for
 *
 * @example
 * ```js
 * import { isNavigationFailure, NavigationFailureType } from 'vue-router'
 *
 * router.afterEach((to, from, failure) => {
 *   // Any kind of navigation failure
 *   if (isNavigationFailure(failure)) {
 *     // ...
 *   }
 *   // Only duplicated navigations
 *   if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
 *     // ...
 *   }
 *   // Aborted or canceled navigations
 *   if (isNavigationFailure(failure, NavigationFailureType.aborted | NavigationFailureType.canceled)) {
 *     // ...
 *   }
 * })
 * ```
 */
export function isNavigationFailure(
  error: any,
  type?: ErrorTypes.NAVIGATION_GUARD_REDIRECT
): error is NavigationRedirectError
export function isNavigationFailure(
  error: any,
  type?: ErrorTypes | NavigationFailureType
): error is NavigationFailure
export function isNavigationFailure(
  error: any,
  type?: number
): error is NavigationFailure {
  return (
    error instanceof Error &&
    NavigationFailureSymbol in error &&
    (type == null || !!((error as unknown as NavigationFailure).type & type))
  )
}

const propertiesToLog = ['params', 'query', 'hash'] as const

function stringifyRoute(to: RouteLocationRaw): string {
  if (typeof to === 'string') return to
  if ('path' in to) return to.path
  const location = {} as Record<string, unknown>
  for (const key of propertiesToLog) {
    if (key in to) location[key] = to[key]
  }
  return JSON.stringify(location, null, 2)
}
