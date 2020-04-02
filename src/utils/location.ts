import { LocationQuery, LocationQueryRaw } from './query'

export interface LocationNormalized {
  path: string
  fullPath: string
  hash: string
  query: LocationQuery
}

export interface LocationPartial {
  path: string
  query?: LocationQueryRaw
  hash?: string
}

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
  if (!base || pathname.indexOf(base) !== 0) return pathname
  return pathname.replace(base, '') || '/'
}
