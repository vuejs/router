import { decode } from '../encoding'
import { type LocationNormalized, resolveRelativePath } from '../location'
import type { LocationQuery } from './query'

// TODO: in next major, merge the two query.ts files and the two location.ts files

/**
 * Transforms a URI into a normalized history location. Same behavior as the
 * legacy `parseURL` but uses `Object.create(null)` for the query object so it
 * cannot be exploited via prototype pollution.
 *
 * @param parseQuery
 * @param location - URI to normalize
 * @param currentLocation - current absolute location. Allows resolving relative
 * paths. Must start with `/`. Defaults to `/`
 * @returns a normalized history location
 */
export function experimental_parseURL(
  parseQuery: (search: string) => LocationQuery,
  location: string,
  currentLocation: string = '/'
): LocationNormalized {
  let path: string | undefined,
    query: LocationQuery = Object.create(null),
    searchString = '',
    hash = ''

  // NOTE: we could use URL and URLSearchParams but they are 2 to 5 times slower than this method
  const hashPos = location.indexOf('#')
  let searchPos = location.indexOf('?')

  // This ensures that the ? is not part of the hash
  // e.g. /foo#hash?query -> has no query
  searchPos = hashPos >= 0 && searchPos > hashPos ? -1 : searchPos

  if (searchPos >= 0) {
    path = location.slice(0, searchPos)
    // keep the ? char
    searchString = location.slice(
      searchPos,
      // hashPos cannot be 0 because there is a search section in the location
      hashPos > 0 ? hashPos : location.length
    )

    query = parseQuery(
      // remove the leading ?
      searchString.slice(1)
    )
  }

  if (hashPos >= 0) {
    // TODO(major): path ||=
    path = path || location.slice(0, hashPos)
    // keep the # character
    hash = location.slice(hashPos, location.length)
  }

  path = resolveRelativePath(
    // TODO(major): path ?? location
    path != null
      ? path
      : // empty path means a relative query or hash `?foo=f`, `#thing`
        location,
    currentLocation
  )

  return {
    // we can't directly use the location parameter because it can be a relative path
    fullPath: path + searchString + hash,
    path,
    query,
    hash: decode(hash),
  }
}
