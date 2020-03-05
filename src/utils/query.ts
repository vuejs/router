import { decode, encodeQueryProperty } from '../utils/encoding'

export type LocationQueryValue = string | null
type LocationQueryValueRaw = LocationQueryValue | number | undefined
export type LocationQuery = Record<
  string,
  LocationQueryValue | LocationQueryValue[]
>
export type LocationQueryRaw = Record<
  string | number,
  LocationQueryValueRaw | LocationQueryValueRaw[]
>

/**
 * Transform a queryString into a query object. Accept both, a version with the leading `?` and without
 * Should work as URLSearchParams
 * @param search
 * @returns a query object
 */
export function parseQuery(search: string): LocationQuery {
  const query: LocationQuery = {}
  // avoid creating an object with an empty key and empty value
  // because of split('&')
  if (search === '' || search === '?') return query
  const hasLeadingIM = search[0] === '?'
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&')
  for (let i = 0; i < searchParams.length; ++i) {
    let [key, rawValue] = searchParams[i].split('=') as [
      string,
      string | undefined
    ]
    key = decode(key)
    // avoid decoding null
    let value = rawValue == null ? null : decode(rawValue)
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
export function stringifyQuery(query: LocationQueryRaw): string {
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
    let values: LocationQueryValueRaw[] = Array.isArray(value)
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
export function normalizeQuery(
  query: LocationQueryRaw | undefined
): LocationQuery {
  const normalizedQuery: LocationQuery = {}

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
