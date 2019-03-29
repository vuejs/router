import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  RouterLocation,
  RouterLocationNormalized,
} from './types/index'
import { stringifyQuery } from './uitls'

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
  resolve(
    location: Readonly<RouterLocation>,
    currentLocation: RouterLocationNormalized
  ): string {
    if (typeof location === 'string') return location

    if ('path' in location) {
      // TODO: warn missing params
      return (
        location.path + stringifyQuery(location.query) + (location.hash || '')
      )
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
        matcher = this.matchers.find(
          m => m.record.path === currentLocation.path
        )
      }
      // return '/using current location'
    } else {
      matcher = this.matchers.find(m => m.record.name === location.name)
    }

    if (!matcher) {
      // TODO: error
      throw new Error('No match for' + location)
    }

    return matcher.resolve(location.params || {})
  }
}
