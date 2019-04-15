import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  RouterLocationNormalized,
} from './types/index'
import { stringifyQuery } from './utils'

// TODO: rename
interface RouteMatcher {
  re: RegExp
  resolve: (params: RouteParams) => string
  record: RouteRecord
  keys: string[]
}

function generateMatcher(record: RouteRecord) {
  const keys: pathToRegexp.Key[] = []
  // TODO: if children use option end: false ?
  const re = pathToRegexp(record.path, keys)
  return {
    re,
    resolve: pathToRegexp.compile(record.path),
    keys: keys.map(k => '' + k.name),
    record,
  }
}

export class RouterMatcher {
  private matchers: RouteMatcher[] = []

  constructor(routes: RouteRecord[]) {
    this.matchers = routes.map(generateMatcher)
  }

  /**
   * Transforms a MatcherLocation object into a normalized location
   * @param location MatcherLocation to resolve to a url
   */
  resolve(
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<RouterLocationNormalized>
  ): RouterLocationNormalized {
    if (typeof location === 'string')
      return {
        path: location,
        fullPath: location,
        // TODO: resolve params, query and hash
        params: {},
        query: {},
        hash: '',
      }

    if ('path' in location) {
      // TODO: warn missing params
      // TODO: extract query and hash? warn about presence
      return {
        path: location.path,
        query: location.query || {},
        hash: location.hash || '',
        params: {},
        fullPath:
          location.path +
          stringifyQuery(location.query) +
          (location.hash || ''),
      }
    }

    let matcher: RouteMatcher | void
    if (!('name' in location)) {
      // TODO: use current location
      // location = {...location, name: this.}
      if (currentLocation.name) {
        // we don't want to match an undefined name
        matcher = this.matchers.find(
          m => m.record.name === currentLocation.name
        )
      } else {
        matcher = this.matchers.find(m => m.re.test(currentLocation.path))
      }
      // return '/using current location'
    } else {
      matcher = this.matchers.find(m => m.record.name === location.name)
    }

    if (!matcher) {
      // TODO: error
      throw new Error(
        'No match for' + JSON.stringify({ ...currentLocation, ...location })
      )
    }

    // TODO: try catch to show missing params
    const fullPath = matcher.resolve(location.params || {})
    return {
      path: fullPath, // TODO: extract path path, query, hash
      fullPath,
      query: {},
      params: {},
      hash: '',
    }
  }
}
