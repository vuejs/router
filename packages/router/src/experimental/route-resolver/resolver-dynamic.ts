import {
  NEW_stringifyURL,
  LocationNormalized,
  parseURL,
  resolveRelativePath,
} from 'src/location'
import { normalizeQuery, stringifyQuery, parseQuery } from 'src/query'
import type { MatcherParamsFormatted } from './matchers/matcher-pattern'
import type { ResolverLocationAsRelative } from './resolver-abstract'
import type { ResolverLocationAsPathAbsolute } from './resolver-abstract'
import type { ResolverLocationAsPathRelative } from './resolver-abstract'
import type { ResolverLocationAsNamed } from './resolver-abstract'
import {
  MatcherQueryParams,
  NEW_RouterResolver_Base,
  NO_MATCH_LOCATION,
  RecordName,
  ResolverLocationResolved,
} from './resolver-abstract'
import { comparePathParserScore } from 'src/matcher/pathParserRanker'
import { warn } from 'src/warning'
import type {
  MatcherPatternPath,
  MatcherPatternQuery,
  MatcherPatternHash,
} from './matchers/matcher-pattern'

/**
 * Manage and resolve routes. Also handles the encoding, decoding, parsing and
 * serialization of params, query, and hash.
 *
 * - `TMatcherRecordRaw` represents the raw record type passed to {@link addMatcher}.
 * - `TMatcherRecord` represents the normalized record type returned by {@link getRecords}.
 */

export interface NEW_RouterResolver<TMatcherRecordRaw, TMatcherRecord>
  extends NEW_RouterResolver_Base<TMatcherRecord> {
  /**
   * Add a matcher record. Previously named `addRoute()`.
   * @param matcher - The matcher record to add.
   * @param parent - The parent matcher record if this is a child.
   */
  addMatcher(
    matcher: TMatcherRecordRaw,
    parent?: TMatcherRecord
  ): TMatcherRecord

  /**
   * Remove a matcher by its name. Previously named `removeRoute()`.
   * @param matcher - The matcher (returned by {@link addMatcher}) to remove.
   */
  removeMatcher(matcher: TMatcherRecord): void

  /**
   * Remove all matcher records. Prevoisly named `clearRoutes()`.
   */
  clearMatchers(): void
}
export function createCompiledMatcher<
  TMatcherRecord extends NEW_MatcherDynamicRecord,
>(
  records: NEW_MatcherRecordRaw[] = []
): NEW_RouterResolver<NEW_MatcherRecordRaw, TMatcherRecord> {
  // TODO: we also need an array that has the correct order
  const matcherMap = new Map<RecordName, TMatcherRecord>()
  const matchers: TMatcherRecord[] = []

  // TODO: allow custom encode/decode functions
  // const encodeParams = applyToParams.bind(null, encodeParam)
  // const decodeParams = transformObject.bind(null, String, decode)
  // const encodeQuery = transformObject.bind(
  //   null,
  //   _encodeQueryKey,
  //   encodeQueryValue
  // )
  // const decodeQuery = transformObject.bind(null, decode, decode)
  // NOTE: because of the overloads, we need to manually type the arguments
  type MatcherResolveArgs =
    | [absoluteLocation: `/${string}`, currentLocation?: undefined]
    | [
        relativeLocation: string,
        currentLocation: ResolverLocationResolved<TMatcherRecord>,
      ]
    | [
        absoluteLocation: ResolverLocationAsPathAbsolute,
        // Same as above
        // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
        currentLocation?: undefined,
      ]
    | [
        relativeLocation: ResolverLocationAsPathRelative,
        currentLocation: ResolverLocationResolved<TMatcherRecord>,
      ]
    | [
        location: ResolverLocationAsNamed,
        // Same as above
        // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
        currentLocation?: undefined,
      ]
    | [
        relativeLocation: ResolverLocationAsRelative,
        currentLocation: ResolverLocationResolved<TMatcherRecord>,
      ]

  function resolve(
    ...args: MatcherResolveArgs
  ): ResolverLocationResolved<TMatcherRecord> {
    const [to, currentLocation] = args

    if (typeof to === 'object' && (to.name || to.path == null)) {
      // relative location or by name
      if (__DEV__ && to.name == null && currentLocation == null) {
        console.warn(
          `Cannot resolve an unnamed relative location without a current location. This will throw in production.`,
          to
        )
        // NOTE: normally there is no query, hash or path but this helps debug
        // what kind of object location was passed
        // @ts-expect-error: to is never
        const query = normalizeQuery(to.query)
        // @ts-expect-error: to is never
        const hash = to.hash ?? ''
        // @ts-expect-error: to is never
        const path = to.path ?? '/'
        return {
          ...NO_MATCH_LOCATION,
          fullPath: NEW_stringifyURL(stringifyQuery, path, query, hash),
          path,
          query,
          hash,
        }
      }

      // either one of them must be defined and is catched by the dev only warn above
      const name = to.name ?? currentLocation?.name
      // FIXME: remove once name cannot be null
      const matcher = name != null && matcherMap.get(name)
      if (!matcher) {
        throw new Error(`Matcher "${String(name)}" not found`)
      }

      // unencoded params in a formatted form that the user came up with
      const params: MatcherParamsFormatted = {
        ...currentLocation?.params,
        ...to.params,
      }
      const path = matcher.path.build(params)
      const hash = matcher.hash?.build(params) ?? ''
      const matched = buildMatched(matcher)
      const query = Object.assign(
        {
          ...currentLocation?.query,
          ...normalizeQuery(to.query),
        },
        ...matched.map(matcher => matcher.query?.build(params))
      )

      return {
        name,
        fullPath: NEW_stringifyURL(stringifyQuery, path, query, hash),
        path,
        query,
        hash,
        params,
        matched,
      }
      // string location, e.g. '/foo', '../bar', 'baz', '?page=1'
    } else {
      // parseURL handles relative paths
      let url: LocationNormalized
      if (typeof to === 'string') {
        url = parseURL(parseQuery, to, currentLocation?.path)
      } else {
        const query = normalizeQuery(to.query)
        url = {
          fullPath: NEW_stringifyURL(stringifyQuery, to.path, query, to.hash),
          path: resolveRelativePath(to.path, currentLocation?.path || '/'),
          query,
          hash: to.hash || '',
        }
      }

      let matcher: TMatcherRecord | undefined
      let matched:
        | ResolverLocationResolved<TMatcherRecord>['matched']
        | undefined
      let parsedParams: MatcherParamsFormatted | null | undefined

      for (matcher of matchers) {
        // match the path because the path matcher only needs to be matched here
        // match the hash because only the deepest child matters
        // End up by building up the matched array, (reversed so it goes from
        // root to child) and then match and merge all queries
        try {
          const pathParams = matcher.path.match(url.path)
          const hashParams = matcher.hash?.match(url.hash)
          matched = buildMatched(matcher)
          const queryParams: MatcherQueryParams = Object.assign(
            {},
            ...matched.map(matcher => matcher.query?.match(url.query))
          )
          // TODO: test performance
          // for (const matcher of matched) {
          //   Object.assign(queryParams, matcher.query?.match(url.query))
          // }
          parsedParams = { ...pathParams, ...queryParams, ...hashParams }
          // we found our match!
          break
        } catch (e) {
          // for debugging tests
          // console.log('❌ ERROR matching', e)
        }
      }

      // No match location
      if (!parsedParams || !matched) {
        return {
          ...url,
          ...NO_MATCH_LOCATION,
          // already decoded
          // query: url.query,
          // hash: url.hash,
        }
      }

      return {
        ...url,
        // matcher exists if matched exists
        name: matcher!.name,
        params: parsedParams,
        matched,
      }
      // TODO: handle object location { path, query, hash }
    }
  }

  function addMatcher(record: NEW_MatcherRecordRaw, parent?: TMatcherRecord) {
    const name = record.name ?? (__DEV__ ? Symbol('unnamed-route') : Symbol())
    // FIXME: proper normalization of the record
    // @ts-expect-error: we are not properly normalizing the record yet
    const normalizedRecord: TMatcherRecord = {
      ...record,
      name,
      parent,
      children: [],
    }

    // insert the matcher if it's matchable
    if (!normalizedRecord.group) {
      const index = findInsertionIndex(normalizedRecord, matchers)
      matchers.splice(index, 0, normalizedRecord)
      // only add the original record to the name map
      if (normalizedRecord.name && !isAliasRecord(normalizedRecord))
        matcherMap.set(normalizedRecord.name, normalizedRecord)
      // matchers.set(name, normalizedRecord)
    }

    record.children?.forEach(childRecord =>
      normalizedRecord.children.push(addMatcher(childRecord, normalizedRecord))
    )

    return normalizedRecord
  }

  for (const record of records) {
    addMatcher(record)
  }

  function removeMatcher(matcher: TMatcherRecord) {
    matcherMap.delete(matcher.name)
    for (const child of matcher.children) {
      removeMatcher(child)
    }
    // TODO: delete from matchers
    // TODO: delete children and aliases
  }

  function clearMatchers() {
    matchers.splice(0, matchers.length)
    matcherMap.clear()
  }

  function getRecords() {
    return matchers
  }

  function getRecord(name: RecordName) {
    return matcherMap.get(name)
  }

  return {
    resolve,

    addMatcher,
    removeMatcher,
    clearMatchers,
    getRecord,
    getRecords,
  }
}

/**
 * Performs a binary search to find the correct insertion index for a new matcher.
 *
 * Matchers are primarily sorted by their score. If scores are tied then we also consider parent/child relationships,
 * with descendants coming before ancestors. If there's still a tie, new routes are inserted after existing routes.
 *
 * @param matcher - new matcher to be inserted
 * @param matchers - existing matchers
 */

export function findInsertionIndex<T extends NEW_MatcherDynamicRecord>(
  matcher: T,
  matchers: T[]
) {
  // First phase: binary search based on score
  let lower = 0
  let upper = matchers.length

  while (lower !== upper) {
    const mid = (lower + upper) >> 1
    const sortOrder = comparePathParserScore(matcher, matchers[mid])

    if (sortOrder < 0) {
      upper = mid
    } else {
      lower = mid + 1
    }
  }

  // Second phase: check for an ancestor with the same score
  const insertionAncestor = getInsertionAncestor(matcher)

  if (insertionAncestor) {
    upper = matchers.lastIndexOf(insertionAncestor, upper - 1)

    if (__DEV__ && upper < 0) {
      // This should never happen
      warn(
        // TODO: fix stringifying new matchers
        `Finding ancestor route "${insertionAncestor.path}" failed for "${matcher.path}"`
      )
    }
  }

  return upper
}
export function getInsertionAncestor<T extends NEW_MatcherDynamicRecord>(
  matcher: T
) {
  let ancestor: T | undefined = matcher

  while ((ancestor = ancestor.parent)) {
    if (!ancestor.group && comparePathParserScore(matcher, ancestor) === 0) {
      return ancestor
    }
  }

  return
}

/**
 * Checks if a record or any of its parent is an alias
 * @param record
 */
export function isAliasRecord<T extends NEW_MatcherDynamicRecord>(
  record: T | undefined
): boolean {
  while (record) {
    if (record.aliasOf) return true
    record = record.parent
  }

  return false
} // pathEncoded`/users/${1}`
// TODO:
// pathEncoded`/users/${null}/end`
// const a: RouteRecordRaw = {} as any
/**
 * Build the `matched` array of a record that includes all parent records from the root to the current one.
 */

export function buildMatched<T extends EXPERIMENTAL_ResolverRecord_Base>(
  record: T
): T[] {
  const matched: T[] = []
  let node: T | undefined = record
  while (node) {
    matched.unshift(node)
    node = node.parent
  }
  return matched
}
export interface EXPERIMENTAL_ResolverRecord_Base {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: RecordName

  /**
   * {@link MatcherPattern} for the path section of the URI.
   */
  path: MatcherPatternPath

  /**
   * {@link MatcherPattern} for the query section of the URI.
   */
  query?: MatcherPatternQuery

  /**
   * {@link MatcherPattern} for the hash section of the URI.
   */
  hash?: MatcherPatternHash

  // TODO: here or in router
  // redirect?: RouteRecordRedirectOption
  parent?: this
  // FIXME: this property is only needed for dynamic routing
  children: this[]
  aliasOf?: this

  /**
   * Is this a record that groups children. Cannot be matched
   */
  group?: boolean
}
export interface NEW_MatcherDynamicRecord
  extends EXPERIMENTAL_ResolverRecord_Base {
  // TODO: the score shouldn't be always needed, it's only needed with dynamic routing
  score: Array<number[]>
} // FIXME: later on, the MatcherRecord should be compatible with RouteRecordRaw (which can miss a path, have children, etc)
/**
 * Experimental new matcher record base type.
 *
 * @experimental
 */

export interface NEW_MatcherRecordRaw {
  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  // NOTE: matchers do not handle `redirect` the redirect option, the router
  // does. They can still match the correct record but they will let the router
  // retrigger a whole navigation to the new location.
  // TODO: probably as `aliasOf`. Maybe a different format with the path, query and has matchers?
  /**
   * Aliases for the record. Allows defining extra paths that will behave like a
   * copy of the record. Allows having paths shorthands like `/users/:id` and
   * `/u/:id`. All `alias` and `path` values must share the same params.
   */
  // alias?: string | string[]
  /**
   * Name for the route record. Must be unique. Will be set to `Symbol()` if
   * not set.
   */
  name?: RecordName

  /**
   * Array of nested routes.
   */
  children?: NEW_MatcherRecordRaw[]

  /**
   * Is this a record that groups children. Cannot be matched
   */
  group?: boolean

  score: Array<number[]>
}
