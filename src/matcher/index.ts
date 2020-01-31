import {
  RouteRecord,
  MatcherLocation,
  MatcherLocationNormalized,
  MatcherLocationRedirect,
  // TODO: add it to matched
  // MatchedRouteRecord,
} from '../types'
import { NoRouteMatchError, InvalidRouteMatch } from '../errors'
import { createRouteRecordMatcher, RouteRecordMatcher } from './path-matcher'
import { RouteRecordNormalized } from './types'
import {
  PathParams,
  comparePathParserScore,
  PathParserOptions,
} from './path-parser-ranker'

interface RouterMatcher {
  addRoute: (record: RouteRecord, parent?: RouteRecordMatcher) => void
  // TODO: remove route
  resolve: (
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ) => MatcherLocationNormalized | MatcherLocationRedirect
}

const TRAILING_SLASH_RE = /(.)\/+$/
function removeTrailingSlash(path: string): string {
  return path.replace(TRAILING_SLASH_RE, '$1')
}

function applyToParam(
  fn: (v: string) => string,
  params: PathParams
): PathParams {
  const newParams: PathParams = {}

  // TODO: could also normalize values like numbers and stuff
  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}

export function createRouterMatcher(
  routes: RouteRecord[],
  globalOptions: PathParserOptions,
  encodeParam: (param: string) => string,
  decodeParam: (param: string) => string
): RouterMatcher {
  const matchers: RouteRecordMatcher[] = []

  function addRoute(
    record: Readonly<RouteRecord>,
    parent?: RouteRecordMatcher
  ): void {
    const mainNormalizedRecord: RouteRecordNormalized = normalizeRouteRecord(
      record
    )
    const options: PathParserOptions = { ...globalOptions, ...record.options }
    // TODO: can probably be removed now that we have our own parser and we handle this correctly
    if (!options.strict)
      mainNormalizedRecord.path = removeTrailingSlash(mainNormalizedRecord.path)
    // generate an array of records to correctly handle aliases
    const normalizedRecords: RouteRecordNormalized[] = [mainNormalizedRecord]
    if ('alias' in record && record.alias) {
      const aliases =
        typeof record.alias === 'string' ? [record.alias] : record.alias
      for (const alias of aliases) {
        normalizedRecords.push({
          ...mainNormalizedRecord,
          path: alias,
        })
      }
    }

    // build up the path for nested routes
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
    // console.log('i is', { i })
    while (
      i < matchers.length &&
      comparePathParserScore(matcher, matchers[i]) >= 0
    )
      i++
    // console.log('END i is', { i })
    // while (i < matchers.length && matcher.score <= matchers[i].score) i++
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
    let matcher: RouteRecordMatcher | undefined
    let params: PathParams = {}
    let path: MatcherLocationNormalized['path']
    let name: MatcherLocationNormalized['name']

    if ('name' in location && location.name) {
      matcher = matchers.find(m => m.record.name === location.name)

      if (!matcher) throw new NoRouteMatchError(location)

      name = matcher.record.name
      // TODO: merge params with current location. Should this be done by name. I think there should be some kind of relationship between the records like children of a parent should keep parent props but not the rest
      params = location.params || currentLocation.params
      // params are automatically encoded
      // TODO: try catch to provide better error messages
      path = matcher.stringify(applyToParam(encodeParam, params))

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
      // matcher should have a value after the loop

      // TODO: if no matcher, return the location with an empty matched array
      // to allow non existent matches
      // TODO: warning of unused params if provided
      if (!matcher) throw new NoRouteMatchError(location)

      params = applyToParam(decodeParam, matcher.parse(location.path)!)
      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      // TODO: check if the note above regarding encoding is still true
      path = location.path
      name = matcher.record.name

      if ('redirect' in matcher.record) {
        const { redirect } = matcher.record
        return {
          redirect,
          normalizedLocation: {
            name,
            path,
            // TODO: verify this is good or add a comment
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
      path = matcher.stringify(applyToParam(encodeParam, params))
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

/**
 * Normalizes a RouteRecord into a MatchedRouteRecord. It also ensures removes
 * traling slashes Returns a copy
 * @param record
 * @returns the normalized version
 */
export function normalizeRouteRecord(
  record: Readonly<RouteRecord>
): RouteRecordNormalized {
  if ('redirect' in record) {
    return {
      path: record.path,
      redirect: record.redirect,
      name: record.name,
      beforeEnter: record.beforeEnter,
      meta: record.meta,
      leaveGuards: [],
    }
  } else {
    return {
      path: record.path,
      components:
        'components' in record
          ? record.components
          : { default: record.component },
      children: record.children,
      name: record.name,
      beforeEnter: record.beforeEnter,
      meta: record.meta,
      leaveGuards: [],
    }
  }
}
