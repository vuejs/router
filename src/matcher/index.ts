import {
  RouteRecord,
  MatcherLocation,
  MatcherLocationNormalized,
} from '../types'
import { NoRouteMatchError } from '../errors'
import { createRouteRecordMatcher, RouteRecordMatcher } from './path-matcher'
import { RouteRecordNormalized } from './types'
import {
  PathParams,
  comparePathParserScore,
  PathParserOptions,
} from './path-parser-ranker'

interface RouterMatcher {
  addRoute: (record: RouteRecord, parent?: RouteRecordMatcher) => void
  removeRoute: (name: Required<RouteRecord>['name']) => void
  // TODO:
  // getRoutes: () => RouteRecordMatcher
  // hasRoute: (name: Required<RouteRecord>['name']) => boolean
  resolve: (
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ) => MatcherLocationNormalized
}

const TRAILING_SLASH_RE = /(.)\/+$/
function removeTrailingSlash(path: string): string {
  return path.replace(TRAILING_SLASH_RE, '$1')
}

export function createRouterMatcher(
  routes: RouteRecord[],
  globalOptions: PathParserOptions
): RouterMatcher {
  // normalized ordered array of matchers
  const matchers: RouteRecordMatcher[] = []
  const matcherMap = new Map<string | symbol, RouteRecordMatcher>()

  function addRoute(
    record: Readonly<RouteRecord>,
    parent?: RouteRecordMatcher
  ): void {
    const mainNormalizedRecord = normalizeRouteRecord(record)
    const options: PathParserOptions = { ...globalOptions, ...record.options }
    // TODO: can probably be removed now that we have our own parser and we handle this correctly
    if (!options.strict)
      mainNormalizedRecord.path = removeTrailingSlash(mainNormalizedRecord.path)
    // generate an array of records to correctly handle aliases
    const normalizedRecords: RouteRecordNormalized[] = [mainNormalizedRecord]
    // TODO: remember aliases in records to allow active in router-link
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

    for (const normalizedRecord of normalizedRecords) {
      let { path } = normalizedRecord
      // build up the path for nested routes if the child isn't an absolute route
      // only add the / delimiter if the child path isn't empty
      if (parent && path[0] !== '/') {
        normalizedRecord.path = parent.record.path + (path && '/' + path)
      }

      // create the object before hand so it can be passed to children
      const matcher = createRouteRecordMatcher(
        normalizedRecord,
        parent,
        options
      )

      if ('children' in record) {
        for (const childRecord of record.children!)
          addRoute(childRecord, matcher)
      }

      insertMatcher(matcher)
    }
  }

  function removeRoute(matcherRef: string | RouteRecordMatcher) {
    if (typeof matcherRef === 'string') {
      const matcher = matcherMap.get(name)
      if (matcher) {
        matcherMap.delete(name)
        matchers.splice(matchers.indexOf(matcher), 1)
        matcher.children.forEach(removeRoute)
      }
    } else {
      let index = matchers.indexOf(matcherRef)
      if (index > -1) {
        matchers.splice(index, 1)
        if (matcherRef.record.name) matcherMap.delete(matcherRef.record.name)
        matcherRef.children.forEach(removeRoute)
      }
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
    if (matcher.record.name) matcherMap.set(matcher.record.name, matcher)
  }

  /**
   * Resolves a location. Gives access to the route record that corresponds to the actual path as well as filling the corresponding params objects
   * @param location MatcherLocation to resolve to a url
   * @param currentLocation MatcherLocationNormalized of the current location
   */
  function resolve(
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ): MatcherLocationNormalized {
    let matcher: RouteRecordMatcher | undefined
    let params: PathParams = {}
    let path: MatcherLocationNormalized['path']
    let name: MatcherLocationNormalized['name']

    if ('name' in location && location.name) {
      matcher = matcherMap.get(location.name)

      if (!matcher) throw new NoRouteMatchError(location)

      name = matcher.record.name
      // TODO: merge params with current location. Should this be done by name. I think there should be some kind of relationship between the records like children of a parent should keep parent props but not the rest
      params = location.params || currentLocation.params
      // params are automatically encoded
      // TODO: try catch to provide better error messages
      path = matcher.stringify(params)
    } else if ('path' in location) {
      matcher = matchers.find(m => m.re.test(location.path))
      // matcher should have a value after the loop

      // TODO: if no matcher, return the location with an empty matched array
      // to allow non existent matches
      // TODO: warning of unused params if provided
      if (!matcher) throw new NoRouteMatchError(location)

      params = matcher.parse(location.path)!
      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      // TODO: check if the note above regarding encoding is still true
      path = location.path
      name = matcher.record.name

      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? matcherMap.get(currentLocation.name)
        : matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher) throw new NoRouteMatchError(location, currentLocation)
      name = matcher.record.name
      params = location.params || currentLocation.params
      path = matcher.stringify(params)
    }

    const matched: MatcherLocationNormalized['matched'] = []
    let parentMatcher: RouteRecordMatcher | void = matcher
    while (parentMatcher) {
      // reversed order so parents are at the beginning
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
  routes.forEach(route => addRoute(route))

  return { addRoute, resolve, removeRoute }
}

/**
 * Normalizes a RouteRecord. Transforms the `redirect` option into a `beforeEnter`
 * @param record
 * @returns the normalized version
 */
export function normalizeRouteRecord(
  record: Readonly<RouteRecord>
): RouteRecordNormalized {
  let components: RouteRecordNormalized['components']
  let beforeEnter: RouteRecordNormalized['beforeEnter']
  if ('redirect' in record) {
    components = {}
    let { redirect } = record
    beforeEnter = (to, from, next) => {
      next(typeof redirect === 'function' ? redirect(to) : redirect)
    }
  } else {
    components =
      'components' in record ? record.components : { default: record.component }
    beforeEnter = record.beforeEnter
  }

  return {
    path: record.path,
    components,
    // fallback to empty array for monomorphic objects
    children: (record as any).children,
    name: record.name,
    beforeEnter,
    meta: record.meta,
    leaveGuards: [],
  }
}
