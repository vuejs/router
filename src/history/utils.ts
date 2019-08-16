import {
  HistoryLocationNormalized,
  HistoryQuery,
  HistoryLocation,
  RawHistoryQuery,
} from './base'

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

    query = normalizeQuery(parseQuery(searchString))
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
  const hasLeadingIM = search[0] === '?'
  const query: HistoryQuery = {}
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === '' || search === '?') return query
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&')
  for (let i = 0; i < searchParams.length; ++i) {
    let [key, value] = searchParams[i].split('=')
    try {
      value = decodeURIComponent(value)
    } catch (err) {
      // TODO: handling only URIError?
      console.warn(
        `[vue-router] error decoding "${value}" while parsing query. Sticking to the original value.`
      )
    }
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

    let values: string[] = Array.isArray(value) ? value : [value]
    try {
      values = values.map(encodeURIComponent)
    } catch (err) {
      // TODO: handling only URIError?

      console.warn(
        `[vue-router] invalid query parameter while stringifying query: "${key}": "${values}"`
      )
    }
    search += `${key}=${values[0]}`
    for (let i = 1; i < values.length; i++) {
      search += `&${key}=${values[i]}`
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
  location: string | HistoryLocation
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
