import { ListenerRemover } from '../types'
// import { encodeQueryProperty, encodeHash } from '../utils/encoding'

// TODO: allow numbers
export type HistoryQuery = Record<string, string | string[]>

interface HistoryLocation {
  // pathname section
  path: string
  // search string parsed
  query?: HistoryQuery
  // hash with the #
  hash?: string
}

export type RawHistoryLocation = HistoryLocation | string

export interface HistoryLocationNormalized extends Required<HistoryLocation> {
  // full path (like href)
  fullPath: string
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
  path: START_PATH,
  query: {},
  hash: '',
}

export type ValueContainer<T> = { value: T }

export interface RouterHistory {
  readonly base: string
  readonly location: HistoryLocationNormalized
  // readonly location: ValueContainer<HistoryLocationNormalized>

  push(to: RawHistoryLocation, data?: any): void
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
 * @param location URI to normalize
 * @returns a normalized history location
 */
export function parseURL(location: string): HistoryLocationNormalized {
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

    // TODO: can we remove the normalize call?
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
 * @param location
 */
export function stringifyURL(location: HistoryLocation): string {
  let url = location.path
  let query = location.query ? stringifyQuery(location.query) : ''

  return url + (query && '?' + query) + (location.hash || '')
}

/**
 * Transform a queryString into a query object. Accept both, a version with the leading `?` and without
 * Should work as URLSearchParams
 * @param search
 * @returns a query object
 */
export function parseQuery(search: string): HistoryQuery {
  const hasLeadingIM = search[0] === '?'
  const query: HistoryQuery = {}
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === '' || search === '?') return query
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&')
  for (let i = 0; i < searchParams.length; ++i) {
    let [key, value] = searchParams[i].split('=')
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
export function stringifyQuery(query: HistoryQuery): string {
  let search = ''
  for (const key in query) {
    if (search.length > 1) search += '&'
    const value = query[key]
    if (value === null) {
      // TODO: should we just add the empty string value?
      search += key
      continue
    }
    // const encodedKey = encodeQueryProperty(key)
    let values: string[] = Array.isArray(value) ? value : [value]
    // const encodedValues = values.map(encodeQueryProperty)

    search += `${key}=${values[0]}`
    for (let i = 1; i < values.length; i++) {
      search += `&${key}=${values[i]}`
    }
  }

  return search
}

/**
 * Normalize a History location object or string into a HistoryLocationNoramlized
 * @param location
 */
export function normalizeLocation(
  location: RawHistoryLocation
): HistoryLocationNormalized {
  if (typeof location === 'string') return parseURL(location)
  else
    return {
      fullPath: stringifyURL(location),
      path: location.path,
      query: location.query || {},
      hash: location.hash || '',
    }
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
