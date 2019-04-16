import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
} from './types/index'
import { NoRouteMatchError } from './errors'

// TODO: rename
interface RouteMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
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
    currentLocation: Readonly<MatcherLocationNormalized>
    // TODO: return type is wrong, should contain fullPath and record/matched
  ): MatcherLocationNormalized {
    let matcher: RouteMatcher | void
    // TODO: refactor with type guards

    if ('path' in location) {
      // we don't even need currentLocation here
      matcher = this.matchers.find(m => m.re.test(location.path))

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      const params: RouteParams = {}
      const result = matcher.re.exec(location.path)
      if (!result) {
        throw new Error(`Error parsing path "${location.path}"`)
      }

      for (let i = 0; i < matcher.keys.length; i++) {
        const key = matcher.keys[i]
        const value = result[i + 1]
        if (!value) {
          throw new Error(
            `Error parsing path "${
              location.path
            }" when looking for key "${key}"`
          )
        }
        params[key] = value
      }

      return {
        name: matcher.record.name,
        /// no need to resolve the path with the matcher as it was provided
        path: location.path,
        params,
      }
    }

    // named route
    if ('name' in location) {
      matcher = this.matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      // TODO: try catch for resolve -> missing params

      return {
        name: location.name,
        path: matcher.resolve(location.params),
        params: location.params || {}, // TODO: normalize params
      }
    }

    // location is a relative path
    if (currentLocation.name) {
      // we don't want to match an undefined name
      matcher = this.matchers.find(m => m.record.name === currentLocation.name)
    } else {
      // match by path
      matcher = this.matchers.find(m => m.re.test(currentLocation.path))
    }

    if (!matcher) throw new NoRouteMatchError(currentLocation, location)

    return {
      name: currentLocation.name,
      path: matcher.resolve(location.params),
      params: location.params || {},
    }
  }
}
