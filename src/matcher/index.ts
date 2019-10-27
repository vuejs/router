import pathToRegexp from 'path-to-regexp'
import {
  RouteRecord,
  RouteParams,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
  // TODO: add it to matched
  // MatchedRouteRecord,
} from '../types'
import { NoRouteMatchError, InvalidRouteMatch } from '../errors'
import { createRouteRecordMatcher, normalizeRouteRecord } from './path-matcher'
import { RouteRecordMatcher } from './types'

interface RouterMatcher {
  addRoute: (record: Readonly<RouteRecord>, parent?: RouteRecordMatcher) => void
  resolve: (
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ) => MatcherLocationNormalized | MatcherLocationRedirect
}

export function createRouterMatcher(routes: RouteRecord[]): RouterMatcher {
  const matchers: RouteRecordMatcher[] = []

  function addRoute(
    record: Readonly<RouteRecord>,
    parent?: RouteRecordMatcher
  ): void {
    const options: pathToRegexp.RegExpOptions = {
      // NOTE: should we make strict by default and redirect /users/ to /users
      // so that it's the same from SEO perspective?
      strict: false,
    }

    // generate an array of records to correctly handle aliases
    const normalizedRecords = [normalizeRouteRecord(record)]
    if ('alias' in record && record.alias) {
      const aliases =
        typeof record.alias === 'string' ? [record.alias] : record.alias
      for (const alias of aliases) {
        const copyForAlias = normalizeRouteRecord(record)
        copyForAlias.path = alias
        normalizedRecords.push(copyForAlias)
      }
    }

    if (parent) {
      // if the child isn't an absolute route
      if (record.path[0] !== '/') {
        let path = parent.record.path
        // only add the / delimiter if the child path isn't empty
        for (const normalizedRecord of normalizedRecords) {
          if (normalizedRecord.path) path += '/'
          path += record.path
          normalizedRecord.path = path
        }
      }
    }

    for (const normalizedRecord of normalizedRecords) {
      // create the object before hand so it can be passed to children
      const matcher = createRouteRecordMatcher(
        normalizedRecord,
        parent,
        options
      )

      if ('children' in record && record.children) {
        for (const childRecord of record.children) {
          addRoute(childRecord, matcher)
        }
        // TODO: the parent is special, we should match their children. They
        // reference to the parent so we can render the parent
        //
        // matcher.score = -10
      }

      insertMatcher(matcher)
    }
  }

  function insertMatcher(matcher: RouteRecordMatcher) {
    let i = 0
    while (i < matchers.length && matcher.score <= matchers[i].score) i++
    matchers.splice(i, 0, matcher)
  }

  /**
   * Resolves a location. Gives access to the route record that corresponds to the actual path as well as filling the corresponding params objects
   * @param location MatcherLocation to resolve to a url
   * @param currentLocation MatcherLocationNormalized of the current location
   */
  function resolve(
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ): MatcherLocationNormalized | MatcherLocationRedirect {
    let matcher: RouteRecordMatcher | void
    let params: RouteParams = {}
    let path: MatcherLocationNormalized['path']
    let name: MatcherLocationNormalized['name']

    if ('name' in location && location.name) {
      matcher = matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(location)

      name = matcher.record.name
      // TODO: merge params
      params = location.params || currentLocation.params
      // params are automatically encoded
      // TODO: try catch to provide better error messages
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
            meta: matcher.record.meta || {},
          },
        }
      }
    } else if ('path' in location) {
      matcher = matchers.find(m => m.re.test(location.path))

      // TODO: if no matcher, return the location with an empty matched array
      // to allow non existent matches
      // TODO: warning of unused params if provided
      if (!matcher) throw new NoRouteMatchError(location)

      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      path = location.path
      name = matcher.record.name

      // fill params
      const result = matcher.re.exec(path)

      if (!result) {
        // TODO: redo message: matching path against X
        throw new Error(`Error parsing path "${location.path}"`)
      }

      for (let i = 0; i < matcher.keys.length; i++) {
        const key = matcher.keys[i]
        let value: string = result[i + 1]
        try {
          value = decodeURIComponent(value)
        } catch (err) {
          if (err instanceof URIError) {
            console.warn(
              `[vue-router] failed decoding param "${key}" with value "${value}". When providing a string location or the "path" property, URL must be properly encoded (TODO: link). Falling back to unencoded value`
            )
          } else {
            throw err
          }
        }
        if (!value) {
          // TODO: handle optional params
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
            meta: matcher.record.meta || {},
          },
        }
      }
      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? matchers.find(m => m.record.name === currentLocation.name)
        : matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher) throw new NoRouteMatchError(location, currentLocation)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.resolve(params)
    }

    // this should never happen because it will mean that the user ended up in a route
    // that redirects but ended up not redirecting
    if ('redirect' in matcher.record) throw new InvalidRouteMatch(location)

    const matched: MatcherLocationNormalized['matched'] = [matcher.record]
    let parentMatcher: RouteRecordMatcher | void = matcher.parent
    while (parentMatcher) {
      // reversed order so parents are at the beginning
      // TODO: should be doable by typing RouteRecordMatcher in a different way
      if ('redirect' in parentMatcher.record) throw new Error('TODO')
      matched.unshift(parentMatcher.record)
      parentMatcher = parentMatcher.parent
    }

    return {
      name,
      path,
      params,
      matched,
      meta: matcher.record.meta || {},
    }
  }

  // add initial routes
  for (const route of routes) {
    addRoute(route)
  }

  return { addRoute, resolve }
}
