import {
  MatcherLocationRaw,
  MatcherLocation,
  RouteLocationRaw,
  RouteLocationNormalized,
} from './types'
import { assign } from './utils'

/**
 * order is important to make it backwards compatible with v3
 */
export const enum ErrorTypes {
  MATCHER_NOT_FOUND = 0,
  NAVIGATION_GUARD_REDIRECT = 1,
  NAVIGATION_ABORTED = 2,
  NAVIGATION_CANCELLED = 3,
  NAVIGATION_DUPLICATED = 4,
}

interface RouterErrorBase extends Error {
  type: ErrorTypes
}

export interface MatcherError extends RouterErrorBase {
  type: ErrorTypes.MATCHER_NOT_FOUND
  location: MatcherLocationRaw
  currentLocation?: MatcherLocation
}

export enum NavigationFailureType {
  aborted = ErrorTypes.NAVIGATION_ABORTED,
  cancelled = ErrorTypes.NAVIGATION_CANCELLED,
  duplicated = ErrorTypes.NAVIGATION_DUPLICATED,
}
export interface NavigationFailure extends RouterErrorBase {
  type:
    | ErrorTypes.NAVIGATION_CANCELLED
    | ErrorTypes.NAVIGATION_ABORTED
    | ErrorTypes.NAVIGATION_DUPLICATED
  from: RouteLocationNormalized
  to: RouteLocationNormalized
}

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
  if (__DEV__ || !__BROWSER__) {
    return assign(
      new Error(ErrorTypeMessages[type](params as any)),
      { type },
      params
    ) as E
  } else {
    return assign(new Error(), { type }, params) as E
  }
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
