import { ListenerRemover } from '../types'
import { decode, encodeQueryProperty } from '../utils/encoding'
// import { encodeQueryProperty, encodeHash } from '../utils/encoding'

type HistoryQueryValue = string | null
type RawHistoryQueryValue = HistoryQueryValue | number | undefined
export type HistoryQuery = Record<
  string,
  HistoryQueryValue | HistoryQueryValue[]
>
export type RawHistoryQuery = Record<
  string | number,
  RawHistoryQueryValue | RawHistoryQueryValue[]
>

interface HistoryLocation {
  fullPath: string
  state?: HistoryState
}

export type RawHistoryLocation = HistoryLocation | string
export type HistoryLocationNormalized = Pick<HistoryLocation, 'fullPath'>
export interface LocationPartial {
  path: string
  query?: RawHistoryQuery
  hash?: string
}
export interface LocationNormalized {
  path: string
  fullPath: string
  hash: string
  query: HistoryQuery
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
  parseQuery: (search: string) => HistoryQuery,
  location: string
): LocationNormalized {
  let path = '',
    query: HistoryQuery = {},
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
  stringifyQuery: (query: RawHistoryQuery) => string,
  location: LocationPartial
): string {
  let query: string = location.query ? stringifyQuery(location.query) : ''
  return location.path + (query && '?') + query + (location.hash || '')
}

/**
 * Transform a queryString into a query object. Accept both, a version with the leading `?` and without
 * Should work as URLSearchParams
 * @param search
 * @returns a query object
 */
export function parseQuery(search: string): HistoryQuery {
  const query: HistoryQuery = {}
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === '' || search === '?') return query
  const hasLeadingIM = search[0] === '?'
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&')
  for (let i = 0; i < searchParams.length; ++i) {
    let [key, value] = searchParams[i].split('=')
    key = decode(key)
    // avoid decoding null
    value = value && decode(value)
    if (key in query) {
      // an extra variable for ts types
      let currentValue = query[key]
      if (!Array.isArray(currentValue)) {
        currentValue = query[key] = [currentValue]
      }
      currentValue.push(value)
    } else {
      query[key] = value
    }
  }
  return query
}
/**
 * Stringify an object query. Works like URLSearchParams. Doesn't prepend a `?`
 * @param query
 */
export function stringifyQuery(query: RawHistoryQuery): string {
  let search = ''
  for (let key in query) {
    if (search.length) search += '&'
    const value = query[key]
    key = encodeQueryProperty(key)
    if (value == null) {
      // only null adds the value
      if (value !== undefined) search += key
      continue
    }
    // keep null values
    let values: RawHistoryQueryValue[] = Array.isArray(value)
      ? value.map(v => v && encodeQueryProperty(v))
      : [value && encodeQueryProperty(value)]

    for (let i = 0; i < values.length; i++) {
      // only append & with i > 0
      search += (i ? '&' : '') + key
      if (values[i] != null) search += ('=' + values[i]) as string
    }
  }

  return search
}

/**
 * Transforms a RawQuery intoe a NormalizedQuery by casting numbers into
 * strings, removing keys with an undefined value and replacing undefined with
 * null in arrays
 * @param query
 */
export function normalizeQuery(query: RawHistoryQuery): HistoryQuery {
  const normalizedQuery: HistoryQuery = {}

  for (let key in query) {
    let value = query[key]
    if (value !== undefined) {
      normalizedQuery[key] = Array.isArray(value)
        ? value.map(v => (v == null ? null : '' + v))
        : value == null
        ? value
        : '' + value
    }
  }

  return normalizedQuery
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
