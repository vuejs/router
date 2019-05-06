import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
} from './types/index'
import { NoRouteMatchError, InvalidRouteMatch } from './errors'

interface RouteMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: RouteRecord // TODO: NormalizedRouteRecord?
  parent: RouteMatcher | void
  keys: string[]
}

// function generateMatcher(record: RouteRecord): RouteMatcher {
//   const keys: pathToRegexp.Key[] = []

//   const options: pathToRegexp.RegExpOptions = {}
//   let children: RouteMatcher[] = []
//   // TODO: if children use option end: false ?
//   // TODO: why is the isArray check necessary for ts?
//   if ('children' in record && Array.isArray(record.children)) {
//     children = record.children.map(generateMatcher)
//     options.end = false // match for partial url
//   }

//   const re = pathToRegexp(record.path, keys, options)

//   return {
//     re,
//     resolve: pathToRegexp.compile(record.path),
//     keys: keys.map(k => '' + k.name),
//     record,
//   }
// }

export class RouterMatcher {
  private matchers: RouteMatcher[] = []

  constructor(routes: RouteRecord[]) {
    for (const route of routes) {
      this.addRouteRecord(route)
    }
  }

  private addRouteRecord(
    record: Readonly<RouteRecord>,
    parent?: RouteMatcher
  ): void {
    const keys: pathToRegexp.Key[] = []
    const options: pathToRegexp.RegExpOptions = {}

    const recordCopy = { ...record }
    if (parent) {
      // if the child isn't an absolute route
      if (record.path[0] !== '/') {
        recordCopy.path = parent.record.path + '/' + record.path // TODO: check for trailing slash?
      }
    }

    const re = pathToRegexp(recordCopy.path, keys, options)

    // create the object before hand so it can be passed to children
    const matcher: RouteMatcher = {
      parent,
      record: recordCopy,
      re,
      keys: keys.map(k => '' + k.name),
      resolve: pathToRegexp.compile(recordCopy.path),
    }

    // TODO: if children use option end: false ?
    // TODO: why is the isArray check necessary for ts?
    if ('children' in record && Array.isArray(record.children)) {
      for (const childRecord of record.children) {
        this.addRouteRecord(childRecord, matcher)
      }
    }

    this.matchers.push(matcher)
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
    let params: RouteParams = {}
    let path: MatcherLocationNormalized['path']
    let name: MatcherLocationNormalized['name']

    // TODO: refactor with type guards

    if ('path' in location) {
      matcher = this.matchers.find(m => m.re.test(location.path))

      // TODO: should go away but stop matching
      // TODO: warning of unused params if provided
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      // no need to resolve the path with the matcher as it was provided
      path = location.path
      name = matcher.record.name

      // fill params
      const result = matcher.re.exec(path)

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
            name,
            path,
            matched: [],
            params,
          },
        }
      }
    }

    // named route
    else if ('name' in location) {
      matcher = this.matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      name = matcher.record.name
      params = location.params || {} // TODO: normalize params
      path = matcher.resolve(params)
      // TODO: check missing params

      if ('redirect' in matcher.record) {
        const { redirect } = matcher.record
        return {
          redirect,
          normalizedLocation: {
            name,
            path,
            matched: [],
            params,
          },
        }
      }
    }

    // location is a relative path
    else if (currentLocation.name) {
      // we don't want to match an undefined name
      matcher = this.matchers.find(m => m.record.name === currentLocation.name)
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.resolve(params)
    } else {
      // match by path
      matcher = this.matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.resolve(params)
    }

    // TODO: allow match without matching record (matched: [])
    if (!matcher) throw new NoRouteMatchError(currentLocation, location)

    // this should never happen because it will mean that the user ended up in a route
    // that redirects but ended up not redirecting
    if ('redirect' in matcher.record) throw new InvalidRouteMatch(location)

    const matched = extractMatchedRecord(matcher)

    return {
      name,
      path,
      params,
      matched,
    }
  }
}

/**
 * Generate the array of the matched array. This is an array containing
 * all records matching a route, from parent to child. If there are no children
 * in the matched record matcher, the array only contains one element
 * @param matcher
 * @returns an array of MatcherLocationNormalized
 */
function extractMatchedRecord(
  matcher: RouteMatcher
): MatcherLocationNormalized['matched'] {
  if ('redirect' in matcher.record) throw new Error('TODO')

  const matched: MatcherLocationNormalized['matched'] = [matcher.record]
  let parentMatcher: RouteMatcher | void = matcher.parent
  while (parentMatcher) {
    // reversed order so parents are at the beginning
    // TODO: should be doable by typing RouteMatcher in a different way
    if ('redirect' in parentMatcher.record) throw new Error('TODO')
    matched.unshift(parentMatcher.record)
    parentMatcher = parentMatcher.parent
  }

  return matched
}
