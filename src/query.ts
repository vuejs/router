import { decode, encodeQueryKey, encodeQueryValue, PLUS_RE } from './encoding'

/**
 * Possible values in normalized {@link LocationQuery}
 *
 * @internal
 */
export type LocationQueryValue = string | null
/**
 * Possible values when defining a query
 *
 * @internal
 */
export type LocationQueryValueRaw = LocationQueryValue | number | undefined
/**
 * Normalized query object that appears in {@link RouteLocationNormalized}
 *
 * @public
 */
export type LocationQuery = Record<
  string,
  LocationQueryValue | LocationQueryValue[]
>
/**
 * Loose {@link LocationQuery} object that can be passed to functions like
 * {@link Router.push} and {@link Router.replace} or anywhere when creating a
 * {@link RouteLocationRaw}
 *
 * @public
 */
export type LocationQueryRaw = Record<
  string | number,
  LocationQueryValueRaw | LocationQueryValueRaw[]
>

/**
 * Transforms a queryString into a {@link LocationQuery} object. Accept both, a
 * version with the leading `?` and without Should work as URLSearchParams

 * @internal
 *
 * @param search - search string to parse
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
    // pre decode the + into space
    const searchParam = searchParams[i].replace(PLUS_RE, ' ')
    // allow the = character
    let eqPos = searchParam.indexOf('=')
    let key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos))
    let value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1))

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
 * Stringifies a {@link LocationQueryRaw} object. Like `URLSearchParams`, it
 * doesn't prepend a `?`
 *
 * @internal
 *
 * @param query - query object to stringify
 * @returns string version of the query without the leading `?`
 */
export function stringifyQuery(query: LocationQueryRaw): string {
  let search = ''
  for (let key in query) {
    if (search.length) search += '&'
    const value = query[key]
    key = encodeQueryKey(key)
    if (value == null) {
      // only null adds the value
      if (value !== undefined) search += key
      continue
    }
    // keep null values
    let values: LocationQueryValueRaw[] = Array.isArray(value)
      ? value.map(v => v && encodeQueryValue(v))
      : [value && encodeQueryValue(value)]

    for (let i = 0; i < values.length; i++) {
      // only append & with i > 0
      search += (i ? '&' : '') + key
      if (values[i] != null) search += ('=' + values[i]) as string
    }
  }

  return search
}

/**
 * Transforms a {@link LocationQueryRaw} into a {@link LocationQuery} by casting
 * numbers into strings, removing keys with an undefined value and replacing
 * undefined with null in arrays
 *
 * @param query - query object to normalize
 * @returns a normalized query object
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
