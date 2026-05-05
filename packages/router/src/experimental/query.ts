import { decode, PLUS_RE } from '../encoding'
import { isArray } from '../utils'

/**
 * Possible values when defining a query. `undefined` allows to remove a value.
 *
 * @internal
 */
export type LocationQueryValueRaw = string | null | number | undefined

/**
 * Normalized query object that appears in {@link RouteLocationNormalized}
 *
 * @public
 */
export type LocationQuery = Record<string, (string | null)[]>
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
 * Transforms a location _search_ into a {@link LocationQuery} object. It
 * expects the first character to be `?`. Normalizes values as arrays even if
 * there is only one value.
 *
 * @internal
 *
 * @param search - search string to parse. Must start with `?` or be empty
 * @returns a query object
 */
export function experimental_parseQuery(search: string): LocationQuery {
  const query: LocationQuery = Object.create(null)
  // remove leading ?
  search = search.slice(1)
  if (!search) return query
  const searchParams = search.split('&')
  for (var i = 0; i < searchParams.length; ++i) {
    // pre decode the + into space
    var searchParam = searchParams[i].replace(PLUS_RE, ' ')
    // allow the = character
    var eqPos = searchParam.indexOf('=')
    var key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos))
    var value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1))

    query[key] ??= []
    query[key].push(value)
  }
  return query
}

/**
 * Transforms a {@link LocationQueryRaw} into a {@link LocationQuery} by casting
 * numbers into strings, removing keys with an undefined value and replacing
 * undefined with null in arrays
 *
 * @param query - query object to normalize
 * @returns a normalized query object
 */
export function experimental_normalizeQuery(
  query: LocationQueryRaw | undefined
): LocationQuery {
  const normalizedQuery: LocationQuery = Object.create(null)

  for (var key in query) {
    var value = query[key]
    if (value !== undefined) {
      normalizedQuery[key] = isArray(value)
        ? value.map(v => (v == null ? null : '' + v))
        : [value == null ? value : '' + value]
    }
  }

  return normalizedQuery
}
