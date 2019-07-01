import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
  // TODO: add it to matched
  // MatchedRouteRecord,
} from './types/index'
import { NoRouteMatchError, InvalidRouteMatch } from './errors'

type NormalizedRouteRecord = Exclude<RouteRecord, { component: any }> // normalize component/components into components

interface RouteMatcher {
  re: RegExp
  resolve: (params?: RouteParams) => string
  record: NormalizedRouteRecord
  parent: RouteMatcher | void
  // TODO: children so they can be removed
  // children: RouteMatcher[]
  keys: string[]
}

/**
 * Normalizes a RouteRecord into a MatchedRouteRecord. Creates a copy
 * @param record
 * @returns the normalized version
 */
export function normalizeRecord(
  record: Readonly<RouteRecord>
): NormalizedRouteRecord {
  if ('component' in record) {
    const { component, ...rest } = record
    // @ts-ignore I could do it type safe by copying again rest:
    // return {
    //   ...rest,
    //   components: { default: component }
    // }
    // but it's slower
    rest.components = { default: component }
    return rest as NormalizedRouteRecord
  }

  // otherwise just create a copy
  return { ...record }
}

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

    const recordCopy = normalizeRecord(record)

    if (parent) {
      // if the child isn't an absolute route
      if (record.path[0] !== '/') {
        let path = parent.record.path
        // only add the / delimiter if the child path isn't empty
        if (recordCopy.path) path += '/'
        path += record.path
        recordCopy.path = path
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

    if ('children' in record && record.children) {
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

    if ('path' in location) {
      matcher = this.matchers.find(m => m.re.test(location.path))

      // TODO: if no matcher, return the location with an empty matched array
      // to allow non existent matches
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
            `Error parsing path "${location.path}" when looking for param "${key}"`
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
      // named route
    } else if ('name' in location) {
      matcher = this.matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(currentLocation, location)

      name = matcher.record.name
      params = location.params || currentLocation.params // TODO: normalize params
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
      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? this.matchers.find(m => m.record.name === currentLocation.name)
        : this.matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher) throw new NoRouteMatchError(currentLocation, location)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.resolve(params)
    }

    // this should never happen because it will mean that the user ended up in a route
    // that redirects but ended up not redirecting
    if ('redirect' in matcher.record) throw new InvalidRouteMatch(location)

    const matched: MatcherLocationNormalized['matched'] = [matcher.record]
    let parentMatcher: RouteMatcher | void = matcher.parent
    while (parentMatcher) {
      // reversed order so parents are at the beginning
      // TODO: should be doable by typing RouteMatcher in a different way
      if ('redirect' in parentMatcher.record) throw new Error('TODO')
      matched.unshift(parentMatcher.record)
      parentMatcher = parentMatcher.parent
    }

    return {
      name,
      path,
      params,
      matched,
    }
  }
}
