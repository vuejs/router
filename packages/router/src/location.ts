import { LocationQuery, LocationQueryRaw } from './query'
import {
  RouteLocation,
  RouteLocationNormalized,
  RouteParamValue,
} from './types'
import { RouteRecord } from './matcher/types'
import { warn } from './warning'
import { isArray } from './utils'

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
 * Transforms a URI into a normalized history location
 *
 * @param parseQuery
 * @param location - URI to normalize
 * @param currentLocation - current absolute location. Allows resolving relative
 * paths. Must start with `/`. Defaults to `/`
 * @returns a normalized history location
 */
export function parseURL(
  parseQuery: (search: string) => LocationQuery,
  location: string,
  currentLocation: string = '/'
): LocationNormalized {
  let path: string | undefined,
    query: LocationQuery = {},
    searchString = '',
    hash = ''

  // Could use URL and URLSearchParams but IE 11 doesn't support it
  // TODO: move to new URL()
  const hashPos = location.indexOf('#')
  let searchPos = location.indexOf('?')
  // the hash appears before the search, so it's not part of the search string
  if (hashPos < searchPos && hashPos >= 0) {
    searchPos = -1
  }

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
  path = resolveRelativePath(path != null ? path : location, currentLocation)
  // empty path means a relative query or hash `?foo=f`, `#thing`

  return {
    fullPath: path + (searchString && '?') + searchString + hash,
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
  const query: string = location.query ? stringifyQuery(location.query) : ''
  return location.path + (query && '?') + query + (location.hash || '')
}

/**
 * Strips off the base from the beginning of a location.pathname in a non-case-sensitive way.
 *
 * @param pathname - location.pathname
 * @param base - base to strip off
 */
export function stripBase(pathname: string, base: string): string {
  // no base or base is not found at the beginning
  if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
    return pathname
  return pathname.slice(base.length) || '/'
}

/**
 * Checks if two RouteLocation are equal. This means that both locations are
 * pointing towards the same {@link RouteRecord} and that all `params`, `query`
 * parameters and `hash` are the same
 *
 * @param stringifyQuery - A function that takes a query object of type LocationQueryRaw and returns a string representation of it.
 * @param a - first {@link RouteLocation}
 * @param b - second {@link RouteLocation}
 */
export function isSameRouteLocation(
  stringifyQuery: (query: LocationQueryRaw) => string,
  a: RouteLocation,
  b: RouteLocation
): boolean {
  const aLastIndex = a.matched.length - 1
  const bLastIndex = b.matched.length - 1

  return (
    aLastIndex > -1 &&
    aLastIndex === bLastIndex &&
    isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) &&
    isSameRouteLocationParams(a.params, b.params) &&
    stringifyQuery(a.query) === stringifyQuery(b.query) &&
    a.hash === b.hash
  )
}

/**
 * Check if two `RouteRecords` are equal. Takes into account aliases: they are
 * considered equal to the `RouteRecord` they are aliasing.
 *
 * @param a - first {@link RouteRecord}
 * @param b - second {@link RouteRecord}
 */
export function isSameRouteRecord(a: RouteRecord, b: RouteRecord): boolean {
  // since the original record has an undefined value for aliasOf
  // but all aliases point to the original record, this will always compare
  // the original record
  return (a.aliasOf || a) === (b.aliasOf || b)
}

export function isSameRouteLocationParams(
  a: RouteLocationNormalized['params'],
  b: RouteLocationNormalized['params']
): boolean {
  if (Object.keys(a).length !== Object.keys(b).length) return false

  for (const key in a) {
    if (!isSameRouteLocationParamsValue(a[key], b[key])) return false
  }

  return true
}

function isSameRouteLocationParamsValue(
  a: RouteParamValue | readonly RouteParamValue[],
  b: RouteParamValue | readonly RouteParamValue[]
): boolean {
  return isArray(a)
    ? isEquivalentArray(a, b)
    : isArray(b)
    ? isEquivalentArray(b, a)
    : a === b
}

/**
 * Check if two arrays are the same or if an array with one single entry is the
 * same as another primitive value. Used to check query and parameters
 *
 * @param a - array of values
 * @param b - array of values or a single value
 */
function isEquivalentArray<T>(a: readonly T[], b: readonly T[] | T): boolean {
  return isArray(b)
    ? a.length === b.length && a.every((value, i) => value === b[i])
    : a.length === 1 && a[0] === b
}

/**
 * Resolves a relative path that starts with `.`.
 *
 * @param to - path location we are resolving
 * @param from - currentLocation.path, should start with `/`
 */
export function resolveRelativePath(to: string, from: string): string {
  if (to.startsWith('/')) return to
  if (__DEV__ && !from.startsWith('/')) {
    warn(
      `Cannot resolve a relative location without an absolute path. Trying to resolve "${to}" from "${from}". It should look like "/${from}".`
    )
    return to
  }

  if (!to) return from

  const fromSegments = from.split('/')
  const toSegments = to.split('/')
  const lastToSegment = toSegments[toSegments.length - 1]

  // make . and ./ the same (../ === .., ../../ === ../..)
  // this is the same behavior as new URL()
  if (lastToSegment === '..' || lastToSegment === '.') {
    toSegments.push('')
  }

  let position = fromSegments.length - 1
  let toPosition: number
  let segment: string

  for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
    segment = toSegments[toPosition]

    // we stay on the same position
    if (segment === '.') continue
    // go up in the from array
    if (segment === '..') {
      // we can't go below zero, but we still need to increment toPosition
      if (position > 1) position--
      // continue
    }
    // we reached a non-relative path, we stop here
    else break
  }

  return (
    fromSegments.slice(0, position).join('/') +
    '/' +
    toSegments
      // ensure we use at least the last element in the toSegments
      .slice(toPosition - (toPosition === toSegments.length ? 1 : 0))
      .join('/')
  )
}
