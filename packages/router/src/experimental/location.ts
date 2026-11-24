import { type LocationNormalized, resolveRelativePath } from '../location'
import { diagnostics } from '../diagnostics'
import { BACKSLASH_RE, ENC_SPACE_RE } from '../encoding'
import { isAbsolutePath } from '../utils'
import type { LocationQuery, LocationQueryRaw } from './query'

// TODO: in next major, merge the two query.ts files and the two location.ts files

/**
 * Transforms an already encoded URI into a normalized history location. Use it
 * when the location comes from the browser (e.g. `location.pathname`), it is
 * faster than {@link experimental_parseURL}. Same behavior as the legacy
 * `parseURL` but uses `Object.create(null)` for the query object so it cannot
 * be exploited via prototype pollution. Unlike the legacy one, `hash` is not
 * decoded.
 *
 * @internal no semver guarantee
 * @param parseQuery - receives the search without the leading `?`
 * @param location - encoded URI to normalize
 * @param currentLocation - current absolute location. Allows resolving relative
 * paths. Must start with `/`. Defaults to `/`
 * @returns a normalized history location
 */
export function parseEncodedURL(
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
    // keep an empty path (`?a#h`) so it resolves to currentLocation
    path ??= location.slice(0, hashPos)
    // keep the # character
    hash = location.slice(hashPos, location.length)
  }

  path = resolveRelativePath(
    // empty path means a relative query or hash `?foo=f`, `#thing`
    path ?? location,
    currentLocation
  )

  return {
    // we can't directly use the location parameter because it can be a relative path
    fullPath: path + searchString + hash,
    path,
    query,
    // the hash is kept as it appears in the URL, like location.hash
    hash,
  }
}

// any special scheme works, it gives the path, query and hash encoding of browsers
const ORIGIN = 'http://t'

/**
 * Transforms a URI into a normalized history location. The URI is normalized
 * with `new URL()`, like a browser does: characters that need it are percent
 * encoded, existing percent encoded sequences are kept, and `.` and `..`
 * segments are resolved. Slower than {@link parseEncodedURL}.
 *
 * @internal no semver guarantee
 * @param parseQuery - receives the search with its leading `?` or `''`
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
  const isAbsolute = isAbsolutePath(location)

  if (__DEV__ && !isAbsolute && !isAbsolutePath(currentLocation)) {
    diagnostics.VUE_ROUTER_R0070({ to: location, from: currentLocation })
    currentLocation = '/'
  }

  const { pathname, search, hash, href } = new URL(
    isAbsolute
      ? // ORIGIN fixes //evil.com
        ORIGIN + location
      : // '', ?query and #hash keep the current path
        !location || location[0] === '?' || location[0] === '#'
        ? location
        : // keeps `scheme:` as a path
          './' + location,
    ORIGIN + currentLocation
  )

  // '' | '?' | '?#…' | '#…', href keeps an empty `?` or `#`
  // 8 is ORIGIN.length
  const rest = href.slice(8 + pathname.length + search.length)

  return {
    // like stringifyQuery() and encodeHash(): spaces in the query are `+` and
    // `\` is `%5C`. The path never keeps a `\`
    fullPath: (pathname + search.replace(ENC_SPACE_RE, '+') + rest).replace(
      BACKSLASH_RE,
      '%5C'
    ),
    path: pathname,
    query: parseQuery(search),
    // hash is `''` for a bare `#`, which hash matchers distinguish
    hash: (hash || (href.endsWith('#') ? '#' : '')).replace(
      BACKSLASH_RE,
      '%5C'
    ),
  }
}

/**
 * Stringifies a URL from its parts. The `hash` must already be encoded (as
 * returned by `encodeHash` or read from a URL), it is appended as is.
 *
 * @internal no semver guarantee
 * @param stringifyQuery - function to stringify the query object
 * @param path - path section of the URL
 * @param query - normalized query object
 * @param hash - encoded hash section of the URL, with its leading `#`
 * @returns the URL string
 */
export function experimental_stringifyURL(
  stringifyQuery: (query?: LocationQueryRaw) => string,
  path: string,
  query?: LocationQueryRaw,
  hash: string = ''
): string {
  const searchText = stringifyQuery(query)
  return path + (searchText && '?') + searchText + hash
}
