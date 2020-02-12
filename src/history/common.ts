import { ListenerRemover } from '../types'
import { LocationQueryRaw, LocationQuery } from '../utils/query'

interface HistoryLocation {
  fullPath: string
  state?: HistoryState
}

export type RawHistoryLocation = HistoryLocation | string
export type HistoryLocationNormalized = Pick<HistoryLocation, 'fullPath'>
export interface LocationPartial {
  path: string
  query?: LocationQueryRaw
  hash?: string
}
export interface LocationNormalized {
  path: string
  fullPath: string
  hash: string
  query: LocationQuery
}

// pushState clones the state passed and do not accept everything
// it doesn't accept symbols, nor functions as values. It also ignores Symbols as keys
type HistoryStateValue =
  | string
  | number
  | boolean
  | null
  | HistoryState
  | HistoryStateArray

export interface HistoryState {
  [x: number]: HistoryStateValue
  [x: string]: HistoryStateValue
}
interface HistoryStateArray extends Array<HistoryStateValue> {}

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
  distance: number
}

export interface NavigationCallback {
  (
    to: HistoryLocationNormalized,
    from: HistoryLocationNormalized,
    information: NavigationInformation
  ): void
}

// starting point for abstract history
const START_PATH = ''
export const START: HistoryLocationNormalized = {
  fullPath: START_PATH,
}

export type ValueContainer<T> = { value: T }

export interface RouterHistory {
  readonly base: string
  readonly location: HistoryLocationNormalized
  // readonly location: ValueContainer<HistoryLocationNormalized>

  push(to: RawHistoryLocation): void
  replace(to: RawHistoryLocation): void

  back(triggerListeners?: boolean): void
  forward(triggerListeners?: boolean): void
  go(distance: number, triggerListeners?: boolean): void

  listen(callback: NavigationCallback): ListenerRemover
  destroy(): void
}

// Generic utils

/**
 * Transforms an URI into a normalized history location
 * @param parseQuery
 * @param location URI to normalize
 * @returns a normalized history location
 */
export function parseURL(
  parseQuery: (search: string) => LocationQuery,
  location: string
): LocationNormalized {
  let path = '',
    query: LocationQuery = {},
    searchString = '',
    hash = ''

  // Could use URL and URLSearchParams but IE 11 doesn't support it
  const searchPos = location.indexOf('?')
  const hashPos = location.indexOf('#', searchPos > -1 ? searchPos : 0)

  if (searchPos > -1) {
    path = location.slice(0, searchPos)
    searchString = location.slice(
      searchPos + 1,
      hashPos > -1 ? hashPos : location.length
    )

    query = parseQuery(searchString)
  }

  if (hashPos > -1) {
    path = path || location.slice(0, hashPos)
    // keep the # character
    hash = location.slice(hashPos, location.length)
  }

  // no search and no query
  path = path || location

  return {
    fullPath: location,
    path,
    query,
    hash,
  }
}

/**
 * Stringify a URL object
 * @param stringifyQuery
 * @param location
 */
export function stringifyURL(
  stringifyQuery: (query: LocationQueryRaw) => string,
  location: LocationPartial
): string {
  let query: string = location.query ? stringifyQuery(location.query) : ''
  return location.path + (query && '?') + query + (location.hash || '')
}

/**
 * Strips off the base from the beginning of a location.pathname
 * @param pathname location.pathname
 * @param base base to strip off
 */
export function stripBase(pathname: string, base: string): string {
  return (
    (base && pathname.indexOf(base) === 0 && pathname.replace(base, '')) ||
    pathname
  )
}

export function normalizeHistoryLocation(
  location: RawHistoryLocation
): HistoryLocationNormalized {
  return {
    // to avoid doing a typeof or in that is quite long
    fullPath: (location as HistoryLocation).fullPath || (location as string),
  }
}
