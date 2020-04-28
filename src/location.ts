import { LocationQuery, LocationQueryRaw, LocationQueryValue } from './query'
import {
  RouteLocation,
  RouteLocationNormalized,
  RouteParamValue,
} from './types'
import { RouteRecord } from './matcher/types'

/**
 * Location object returned by {@link `parseURL`}.
 * @internal
 */
interface LocationNormalized {
  path: string
  fullPath: string
  hash: string
  query: LocationQuery
}

/**
 * Location object accepted by {@link `stringifyURL`}.
 * @internal
 */
interface LocationPartial {
  path: string
  query?: LocationQueryRaw
  hash?: string
}

const TRAILING_SLASH_RE = /\/$/
export const removeTrailingSlash = (path: string) =>
  path.replace(TRAILING_SLASH_RE, '')

/**
 * Transforms an URI into a normalized history location
 *
 * @param parseQuery
 * @param location - URI to normalize
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
 * Stringifies a URL object
 *
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
 *
 * @param pathname - location.pathname
 * @param base - base to strip off
 */
export function stripBase(pathname: string, base: string): string {
  // no base or base is not found at the begining
  if (!base || pathname.indexOf(base)) return pathname
  return pathname.replace(base, '') || '/'
}

/**
 * Checks if two RouteLocation are equal. This means that both locations are
 * pointing towards the same {@link RouteRecord} and that all `params`, `query`
 * parameters and `hash` are the same
 *
 * @param a first {@link RouteLocation}
 * @param b second {@link RouteLocation}
 */
export function isSameRouteLocation(
  a: RouteLocation,
  b: RouteLocation
): boolean {
  let aLastIndex = a.matched.length - 1
  let bLastIndex = b.matched.length - 1

  return (
    aLastIndex > -1 &&
    aLastIndex === bLastIndex &&
    isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) &&
    isSameLocationObject(a.params, b.params) &&
    isSameLocationObject(a.query, b.query) &&
    a.hash === b.hash
  )
}

/**
 * Check if two `RouteRecords` are equal. Takes into account aliases: they are
 * considered equal to the `RouteRecord` they are aliasing.
 *
 * @param a first {@link RouteRecord}
 * @param b second {@link RouteRecord}
 */
export function isSameRouteRecord(a: RouteRecord, b: RouteRecord): boolean {
  // since the original record has an undefined value for aliasOf
  // but all aliases point to the original record, this will always compare
  // the original record
  return (a.aliasOf || a) === (b.aliasOf || b)
}

export function isSameLocationObject(
  a: RouteLocationNormalized['query'],
  b: RouteLocationNormalized['query']
): boolean
export function isSameLocationObject(
  a: RouteLocationNormalized['params'],
  b: RouteLocationNormalized['params']
): boolean
export function isSameLocationObject(
  a: RouteLocationNormalized['query' | 'params'],
  b: RouteLocationNormalized['query' | 'params']
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) return false

  for (let key in a) {
    if (!isSameLocationObjectValue(a[key], b[key])) return false
  }

  return true
}

function isSameLocationObjectValue(
  a: LocationQueryValue | LocationQueryValue[],
  b: LocationQueryValue | LocationQueryValue[]
): boolean
function isSameLocationObjectValue(
  a: RouteParamValue | RouteParamValue[],
  b: RouteParamValue | RouteParamValue[]
): boolean
function isSameLocationObjectValue(
  a:
    | LocationQueryValue
    | LocationQueryValue[]
    | RouteParamValue
    | RouteParamValue[],
  b:
    | LocationQueryValue
    | LocationQueryValue[]
    | RouteParamValue
    | RouteParamValue[]
): boolean {
  return Array.isArray(a)
    ? isEquivalentArray(a, b)
    : Array.isArray(b)
    ? isEquivalentArray(b, a)
    : a === b
}

/**
 * Check if two arrays are the same or if an array with one single entry is the
 * same as another primitive value. Used to check query and parameters
 *
 * @param a array of values
 * @param b array of values or a single value
 */
function isEquivalentArray<T>(a: T[], b: T[] | T): boolean {
  return Array.isArray(b)
    ? a.length === b.length && a.every((value, i) => value === b[i])
    : a.length === 1 && a[0] === b
}
