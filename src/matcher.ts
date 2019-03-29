import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  ParamsType,
  START_RECORD,
  RouterLocation,
  RouterLocationNormalized,
} from './types/index'

// TODO: rename
interface RouteMatcher {
  re: RegExp
  resolve: (params: ParamsType) => string
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

const START_MATCHER = generateMatcher(START_RECORD)

export class RouterMatcher {
  private matchers: RouteMatcher[] = []

  constructor(routes: RouteRecord[]) {
    this.matchers = routes.map(generateMatcher)
  }

  /**
   * Normalize a RouterLocation into an object that is easier to handle
   * @param location location to normalize
   * @param currentLocation current location, to reuse params and location
   */
  normalize(
    location: Readonly<RouterLocation>,
    currentLocation: Readonly<RouterLocationNormalized>
  ): RouterLocationNormalized {
    return {} as RouterLocationNormalized
  }

  /**
   * Transforms a RouterLocation object into a URL string. If a string is
   * passed, it returns the string itself
   * @param location RouterLocation to resolve to a url
   */
  resolve(location: Readonly<RouterLocation>): string {
    if (typeof location === 'string') return location
    if ('path' in location) {
      // TODO: convert query, hash, warn params
      return location.path
    }

    let matcher: RouteMatcher | void
    if (!('name' in location)) {
      // TODO: use current location
      // location = {...location, name: this.}
      matcher = this.routes.find(r => r.record.name === this.currentRoute.name)
      // return '/using current location'
    } else {
      matcher = this.routes.find(r => r.record.name === location.name)
    }

    if (!matcher) {
      // TODO: error
      throw new Error('No match for' + location)
    }

    return matcher.resolve(location.params || {})
  }
}
