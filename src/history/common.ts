import { ListenerRemover } from '../types'

export type HistoryQuery = Record<string, string | string[]>
// TODO: is it reall worth allowing null to form queries like ?q&b&c
// When parsing using URLSearchParams, `q&c=` yield an empty string for q and c
// I think it's okay to allow this by default and allow extending it
// a more permissive history query
// TODO: allow numbers
export type RawHistoryQuery = Record<string, string | string[] | null>

interface HistoryLocation {
  // pathname section
  path: string
  // search string parsed
  query?: RawHistoryQuery
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

export interface RouterHistory {
  readonly base: string
  readonly location: HistoryLocationNormalized

  push(to: RawHistoryLocation, data?: any): void
  replace(to: RawHistoryLocation): void

  back(triggerListeners?: boolean): void
  forward(triggerListeners?: boolean): void
  go(distance: number, triggerListeners?: boolean): void

  listen(callback: NavigationCallback): ListenerRemover
  destroy(): void
}

// Generic utils

// needed for the global flag
const PERCENT_RE = /%/g

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
    query = normalizeQuery(parseQuery(searchString))
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

function safeDecodeUriComponent(value: string): string {
  try {
    value = decodeURIComponent(value)
  } catch (err) {
    // TODO: handling only URIError?
    console.warn(
      `[vue-router] error decoding query "${value}". Keeping the original value.`
    )
  }

  return value
}

function safeEncodeUriComponent(value: string): string {
  try {
    value = encodeURIComponent(value)
  } catch (err) {
    // TODO: handling only URIError?
    console.warn(
      `[vue-router] error encoding query "${value}". Keeping the original value.`
    )
  }

  return value
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
    key = safeDecodeUriComponent(key)
    value = safeDecodeUriComponent(value)
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
 * Stringify a URL object
 * @param location
 */
export function stringifyURL(location: HistoryLocation): string {
  let url = location.path
  let query = location.query ? stringifyQuery(location.query) : ''

  return url + (query && '?' + query) + (location.hash || '')
}

/**
 * Stringify an object query. Works like URLSearchParams. Doesn't prepend a `?`
 * @param query
 */
export function stringifyQuery(query: RawHistoryQuery): string {
  let search = ''
  // TODO: util function?
  for (const key in query) {
    if (search.length > 1) search += '&'
    const value = query[key]
    if (value === null) {
      // TODO: should we just add the empty string value?
      search += key
      continue
    }
    let encodedKey = safeEncodeUriComponent(key)
    let values: string[] = Array.isArray(value) ? value : [value]
    values = values.map(safeEncodeUriComponent)

    search += `${encodedKey}=${values[0]}`
    for (let i = 1; i < values.length; i++) {
      search += `&${encodedKey}=${values[i]}`
    }
  }

  return search
}

export function normalizeQuery(query: RawHistoryQuery): HistoryQuery {
  // TODO: implem
  const normalizedQuery: HistoryQuery = {}
  for (const key in query) {
    const value = query[key]
    if (value === null) normalizedQuery[key] = ''
    else normalizedQuery[key] = value
  }
  return normalizedQuery
}

/**
 * Prepare a URI string to be passed to pushState
 * @param uri
 */
export function prepareURI(uri: string) {
  // encode the % symbol so it also works on IE
  return uri.replace(PERCENT_RE, '%25')
}

// use regular decodeURI
// Use a renamed export instead of global.decodeURI
// to support node and browser at the same time
const originalDecodeURI = decodeURI
export { originalDecodeURI as decodeURI }

/**
 * Normalize a History location into an object that looks like
 * the one at window.location
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
      query: location.query ? normalizeQuery(location.query) : {},
      hash: location.hash || '',
    }
}
