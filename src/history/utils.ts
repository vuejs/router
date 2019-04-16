import {
  HistoryLocationNormalized,
  HistoryQuery,
  HistoryLocation,
} from './base'
import { RouteQuery } from '../types'

const PERCENT_RE = /%/g

/**
 * Transforms a URL into an object
 * @param location location to normalize
 * @param currentLocation current location, to reuse params and location
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

    query = parseQuery(searchString)
  }

  if (hashPos > -1) {
    path = path || location.slice(0, hashPos)
    hash = location.slice(hashPos, location.length)
  }

  path = path || location

  return {
    fullPath: location,
    path,
    query,
    hash,
  }
}

/**
 * Transform a queryString into a query object. Accept both, a version with the leading `?` and without
 * Should work as URLSearchParams
 * @param search
 */
export function parseQuery(search: string): HistoryQuery {
  // TODO: optimize by using a for loop
  const hasLeadingIM = search[0] === '?'
  return (hasLeadingIM ? search.slice(1) : search).split('&').reduce(
    (query: HistoryQuery, entry: string) => {
      const [key, value] = entry.split('=')
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

      return query
    },
    {} as HistoryQuery
  )
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
export function stringifyQuery(query: HistoryQuery): string {
  let search = ''
  // TODO: util function?
  for (const key in query) {
    if (search.length > 1) search += '&'
    // TODO: handle array
    const value = query[key]
    if (Array.isArray(value)) {
      search += `${key}=${value[0]}`
      for (let i = 1; i < value.length; i++) {
        search += `&${key}=${value[i]}`
      }
    } else {
      search += `${key}=${query[key]}`
    }
  }

  return search
}

export function normalizeQuery(query: RouteQuery): HistoryQuery {
  // TODO: implem
  return query as HistoryQuery
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
export const decodeURI = global.decodeURI

/**
 * Normalize a History location into an object that looks like
 * the one at window.location
 * @param location
 */
export function normalizeLocation(
  location: string | HistoryLocation
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
