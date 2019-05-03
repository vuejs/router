import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
} from './types/index'
import { NoRouteMatchError } from './errors'

interface RouteMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: RouteRecord
  keys: string[]
}

function generateMatcher(record: RouteRecord): RouteMatcher {
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
   * Resolve a location without doing redirections so it can be used for anchors
   */
  resolveAsPath() {}

  /**
   * Transforms a MatcherLocation object into a normalized location
   * @param location MatcherLocation to resolve to a url
   */
  resolve(
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ): MatcherLocationNormalized | MatcherLocationRedirect {
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

      if ('redirect' in matcher.record) {
        const { redirect } = matcher.record
        return {
          redirect,
          normalizedLocation: {
            name: matcher.record.name,
            path: location.path,
            matched: [],
            params,
          },
        }
        // if redirect is a function we do not have enough information, so we throw
        // TODO: not use a throw
        // throw new RedirectInRecord(typeof redirect === 'function' ? {
        //   redirect,
        //   route: { name: matcher.record.name, path: location.path, params, matched: [] }
        // } : redirect)
      }

      // TODO: build up the array with children based on current location
      const matched = [matcher.record]

      return {
        name: matcher.record.name,
        /// no need to resolve the path with the matcher as it was provided
        path: location.path,
        params,
        matched,
      }
    }

    // named route
    if ('name' in location) {
      matcher = this.matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)
      if ('redirect' in matcher.record) throw new Error('TODO')

      // TODO: build up the array with children based on current location
      const matched = [matcher.record]

      // TODO: try catch for resolve -> missing params

      return {
        name: location.name,
        path: matcher.resolve(location.params),
        params: location.params || {}, // TODO: normalize params
        matched,
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
    if ('redirect' in matcher.record) throw new Error('TODO')

    // TODO: build up the array with children based on current location
    const matched = [matcher.record]

    let params = location.params ? location.params : currentLocation.params

    return {
      name: currentLocation.name,
      path: matcher.resolve(params),
      params,
      matched,
    }
  }
}
