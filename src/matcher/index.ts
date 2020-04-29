import {
  RouteRecordRaw,
  MatcherLocationRaw,
  MatcherLocation,
  isRouteName,
  RouteRecordName,
} from '../types'
import { createRouterError, ErrorTypes, MatcherError } from '../errors'
import { createRouteRecordMatcher, RouteRecordMatcher } from './pathMatcher'
import { RouteRecordRedirect, RouteRecordNormalized } from './types'
import {
  PathParams,
  comparePathParserScore,
  PathParserOptions,
} from './pathParserRanker'
import { warn } from 'vue'

let noop = () => {}

interface RouterMatcher {
  addRoute: (record: RouteRecordRaw, parent?: RouteRecordMatcher) => () => void
  removeRoute: {
    (matcher: RouteRecordMatcher): void
    (name: RouteRecordName): void
  }
  getRoutes: () => RouteRecordMatcher[]
  getRecordMatcher: (name: RouteRecordName) => RouteRecordMatcher | undefined
  resolve: (
    location: MatcherLocationRaw,
    currentLocation: MatcherLocation
  ) => MatcherLocation
}

export function createRouterMatcher(
  routes: RouteRecordRaw[],
  globalOptions: PathParserOptions
): RouterMatcher {
  // normalized ordered array of matchers
  const matchers: RouteRecordMatcher[] = []
  const matcherMap = new Map<RouteRecordName, RouteRecordMatcher>()

  function getRecordMatcher(name: RouteRecordName) {
    return matcherMap.get(name)
  }

  function addRoute(
    record: RouteRecordRaw,
    parent?: RouteRecordMatcher,
    originalRecord?: RouteRecordMatcher
  ) {
    let mainNormalizedRecord = normalizeRouteRecord(record)
    // we might be the child of an alias
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record
    const options: PathParserOptions = { ...globalOptions, ...record.options }
    // generate an array of records to correctly handle aliases
    const normalizedRecords: typeof mainNormalizedRecord[] = [
      mainNormalizedRecord,
    ]
    if ('alias' in record) {
      const aliases =
        typeof record.alias === 'string' ? [record.alias] : record.alias!
      for (const alias of aliases) {
        normalizedRecords.push({
          ...mainNormalizedRecord,
          // this allows us to hold a copy of the `components` option
          // so that async components cache is hold on the original record
          components: originalRecord
            ? originalRecord.record.components
            : mainNormalizedRecord.components,
          path: alias,
          // we might be the child of an alias
          aliasOf: originalRecord
            ? originalRecord.record
            : mainNormalizedRecord,
          // the aliases are always of the same kind as the original since they
          // are defined on the same record
        } as typeof mainNormalizedRecord)
      }
    }

    let matcher: RouteRecordMatcher
    let originalMatcher: RouteRecordMatcher | undefined

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

      // if we are an alias we must tell the original record that we exist
      // so we can be removed
      if (originalRecord) {
        originalRecord.alias.push(matcher)
      } else {
        // otherwise, the first record is the original and others are aliases
        originalMatcher = originalMatcher || matcher
        if (originalMatcher !== matcher) originalMatcher.alias.push(matcher)
      }

      // only non redirect records have children
      if ('children' in mainNormalizedRecord) {
        let children = mainNormalizedRecord.children
        for (let i = 0; i < children.length; i++) {
          addRoute(
            children[i],
            matcher,
            originalRecord && originalRecord.children[i]
          )
        }
      }

      // if there was no original record, then the first one was not an alias and all
      // other alias (if any) need to reference this record when adding children
      originalRecord = originalRecord || matcher

      insertMatcher(matcher)
    }

    return originalMatcher
      ? () => {
          // since other matchers are aliases, they should be removed by the original matcher
          removeRoute(originalMatcher!)
        }
      : noop
  }

  function removeRoute(matcherRef: RouteRecordName | RouteRecordMatcher) {
    if (isRouteName(matcherRef)) {
      const matcher = matcherMap.get(matcherRef)
      if (matcher) {
        matcherMap.delete(matcherRef)
        matchers.splice(matchers.indexOf(matcher), 1)
        matcher.children.forEach(removeRoute)
        matcher.alias.forEach(removeRoute)
      }
    } else {
      let index = matchers.indexOf(matcherRef)
      if (index > -1) {
        matchers.splice(index, 1)
        if (matcherRef.record.name) matcherMap.delete(matcherRef.record.name)
        matcherRef.children.forEach(removeRoute)
        matcherRef.alias.forEach(removeRoute)
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
    if (matcher.record.name && !isAliasRecord(matcher))
      matcherMap.set(matcher.record.name, matcher)
  }

  /**
   * Resolves a location. Gives access to the route record that corresponds to the actual path as well as filling the corresponding params objects
   *
   * @param location - MatcherLocationRaw to resolve to a url
   * @param currentLocation - MatcherLocation of the current location
   */
  function resolve(
    location: Readonly<MatcherLocationRaw>,
    currentLocation: Readonly<MatcherLocation>
  ): MatcherLocation {
    let matcher: RouteRecordMatcher | undefined
    let params: PathParams = {}
    let path: MatcherLocation['path']
    let name: MatcherLocation['name']

    if ('name' in location && location.name) {
      matcher = matcherMap.get(location.name)

      if (!matcher)
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, {
          location,
        })

      name = matcher.record.name
      params = {
        ...paramsFromLocation(
          currentLocation.params,
          matcher.keys.map(k => k.name)
        ),
        ...location.params,
      }
      // throws if cannot be stringified
      path = matcher.stringify(params)
    } else if ('path' in location) {
      // no need to resolve the path with the matcher as it was provided
      // this also allows the user to control the encoding
      path = location.path

      if (__DEV__ && path[0] !== '/') {
        warn(
          `The Matcher cannot resolve relative paths but received "${path}". Unless you directly called \`matcher.resolve("${path}")\`, this is probably a bug in vue-router. Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-router-next.`
        )
      }

      matcher = matchers.find(m => m.re.test(path))
      // matcher should have a value after the loop

      if (matcher) {
        // TODO: dev warning of unused params if provided
        params = matcher.parse(path)!
        name = matcher.record.name
      }
      // location is a relative path
    } else {
      // match by name or path of current route
      matcher = currentLocation.name
        ? matcherMap.get(currentLocation.name)
        : matchers.find(m => m.re.test(currentLocation.path))
      if (!matcher)
        throw createRouterError<MatcherError>(ErrorTypes.MATCHER_NOT_FOUND, {
          location,
          currentLocation,
        })
      name = matcher.record.name
      // since we are navigating to the same location, we don't need to pick the
      // params like when `name` is provided
      params = { ...currentLocation.params, ...location.params }
      path = matcher.stringify(params)
    }

    const matched: MatcherLocation['matched'] = []
    let parentMatcher: RouteRecordMatcher | undefined = matcher
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
      meta: mergeMetaFields(matched),
    }
  }

  // add initial routes
  routes.forEach(route => addRoute(route))

  return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher }
}

function paramsFromLocation(
  params: MatcherLocation['params'],
  keys: string[]
): MatcherLocation['params'] {
  let newParams = {} as MatcherLocation['params']

  for (let key of keys) {
    if (key in params) newParams[key] = params[key]
  }

  return newParams
}

/**
 * Normalizes a RouteRecordRaw. Transforms the `redirect` option into a `beforeEnter`
 * @param record
 * @returns the normalized version
 */
export function normalizeRouteRecord(
  record: RouteRecordRaw
): RouteRecordNormalized | RouteRecordRedirect {
  const commonInitialValues = {
    path: record.path,
    name: record.name,
    meta: record.meta || {},
    aliasOf: undefined,
    components: {},
  }

  if ('redirect' in record) {
    return {
      ...commonInitialValues,
      redirect: record.redirect,
    }
  } else {
    return {
      ...commonInitialValues,
      beforeEnter: record.beforeEnter,
      props: record.props || false,
      children: record.children || [],
      instances: {},
      leaveGuards: [],
      updateGuards: [],
      components:
        'components' in record
          ? record.components
          : { default: record.component },
    }
  }
}

/**
 * Checks if a record or any of its parent is an alias
 * @param record
 */
function isAliasRecord(record: RouteRecordMatcher | undefined): boolean {
  while (record) {
    if (record.record.aliasOf) return true
    record = record.parent
  }

  return false
}

/**
 * Merge meta fields of an array of records
 *
 * @param matched array of matched records
 */
function mergeMetaFields(matched: MatcherLocation['matched']) {
  return matched.reduce(
    (meta, record) => ({
      ...meta,
      ...record.meta,
    }),
    {} as MatcherLocation['meta']
  )
}

export { PathParserOptions }
