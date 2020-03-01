import {
  RouteRecord,
  MatcherLocation,
  MatcherLocationNormalized,
  ListenerRemover,
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
  addRoute: (
    record: RouteRecord,
    parent?: RouteRecordMatcher
  ) => ListenerRemover
  removeRoute: {
    (matcher: RouteRecordMatcher): void
    (name: Required<RouteRecord>['name']): void
  }
  getRoutes: () => RouteRecordMatcher[]
  getRecordMatcher: (
    name: Required<RouteRecord>['name']
  ) => RouteRecordMatcher | undefined
  resolve: (
    location: Readonly<MatcherLocation>,
    currentLocation: Readonly<MatcherLocationNormalized>
  ) => MatcherLocationNormalized
}

export function createRouterMatcher(
  routes: RouteRecord[],
  globalOptions: PathParserOptions
): RouterMatcher {
  // normalized ordered array of matchers
  const matchers: RouteRecordMatcher[] = []
  const matcherMap = new Map<string | symbol, RouteRecordMatcher>()

  function getRecordMatcher(name: string) {
    return matcherMap.get(name)
  }

  // TODO: add routes to children of parent
  function addRoute(
    record: Readonly<RouteRecord>,
    parent?: RouteRecordMatcher
  ) {
    const mainNormalizedRecord = normalizeRouteRecord(record)
    const options: PathParserOptions = { ...globalOptions, ...record.options }
    // generate an array of records to correctly handle aliases
    const normalizedRecords: RouteRecordNormalized[] = [mainNormalizedRecord]
    if ('alias' in record) {
      const aliases =
        typeof record.alias === 'string' ? [record.alias] : record.alias!
      for (const alias of aliases) {
        normalizedRecords.push({
          ...mainNormalizedRecord,
          path: alias,
          aliasOf: mainNormalizedRecord,
        })
      }
    }

    let matcher: RouteRecordMatcher

    for (const normalizedRecord of normalizedRecords) {
      let { path } = normalizedRecord
      // Build up the path for nested routes if the child isn't an absolute
      // route. Only add the / delimiter if the child path isn't empty and if the
      // parent path doesn't have a trailing slash
      if (parent && path[0] !== '/') {
        let parentPath = parent.record.path
        let connectingSlash =
          parentPath[parentPath.length - 1] === '/' ? '' : '/'
        normalizedRecord.path =
          parent.record.path + (path && connectingSlash + path)
      }

      // create the object before hand so it can be passed to children
      matcher = createRouteRecordMatcher(normalizedRecord, parent, options)

      if ('children' in record) {
        for (const childRecord of record.children!)
          addRoute(childRecord, matcher)
      }

      insertMatcher(matcher)
    }

    return () => {
      // since other matchers are aliases, they should should be removed by any of the matchers
      removeRoute(matcher)
    }
  }

  function removeRoute(matcherRef: string | RouteRecordMatcher) {
    // TODO: remove aliases (needs to keep them in the RouteRecordMatcher first)
    if (typeof matcherRef === 'string') {
      const matcher = matcherMap.get(matcherRef)
      if (matcher) {
        matcherMap.delete(matcherRef)
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

  function getRoutes() {
    return matchers
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
    // only add the original record to the name map
    if (matcher.record.name && !matcher.record.aliasOf)
      matcherMap.set(matcher.record.name, matcher)
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
      // needs an RFC if breaking change
      params = location.params || currentLocation.params
      // throws if cannot be stringified
      path = matcher.stringify(params)
    } else if ('path' in location) {
      matcher = matchers.find(m => m.re.test(location.path))
      // matcher should have a value after the loop

      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      path = location.path
      if (matcher) {
        // TODO: dev warning of unused params if provided
        params = matcher.parse(location.path)!
        name = matcher.record.name
      }
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
      // const { record } = parentMatcher
      // TODO: check resolving child routes by path when parent has an alias
      matched.unshift(parentMatcher.record)
      parentMatcher = parentMatcher.parent
    }

    return {
      name,
      path,
      params,
      matched,
      meta: matcher ? matcher.record.meta : {},
    }
  }

  // add initial routes
  routes.forEach(route => addRoute(route))

  return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher }
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
    meta: record.meta || {},
    leaveGuards: [],
    aliasOf: undefined,
  }
}

export { PathParserOptions }
