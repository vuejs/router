import {
  type LocationQuery,
  normalizeQuery,
  parseQuery,
  stringifyQuery,
} from '../query'
import type {
  MatcherPatternHash,
  MatcherPatternPath,
  MatcherPatternQuery,
} from './matcher-pattern'
import { warn } from '../warning'
import { encodeQueryValue as _encodeQueryValue, encodeParam } from '../encoding'
import {
  LocationNormalized,
  NEW_stringifyURL,
  parseURL,
  resolveRelativePath,
} from '../location'
import type {
  MatcherLocationAsNamed,
  MatcherLocationAsPathAbsolute,
  MatcherLocationAsPathRelative,
  MatcherLocationAsRelative,
  MatcherParamsFormatted,
} from './matcher-location'
import { _RouteRecordProps } from '../typed-routes'
import { comparePathParserScore } from '../matcher/pathParserRanker'

/**
 * Allowed types for a matcher name.
 */
export type MatcherName = string | symbol

/**
 * Manage and resolve routes. Also handles the encoding, decoding, parsing and
 * serialization of params, query, and hash.
 *
 * - `TMatcherRecordRaw` represents the raw record type passed to {@link addMatcher}.
 * - `TMatcherRecord` represents the normalized record type returned by {@link getMatchers}.
 */
export interface NEW_RouterResolver<TMatcherRecordRaw, TMatcherRecord> {
  /**
   * Resolves an absolute location (like `/path/to/somewhere`).
   */
  resolve(
    absoluteLocation: `/${string}`,
    currentLocation?: undefined
  ): NEW_LocationResolved<TMatcherRecord>

  /**
   * Resolves a string location relative to another location. A relative location can be `./same-folder`,
   * `../parent-folder`, `same-folder`, or even `?page=2`.
   */
  resolve(
    relativeLocation: string,
    currentLocation: NEW_LocationResolved<TMatcherRecord>
  ): NEW_LocationResolved<TMatcherRecord>

  /**
   * Resolves a location by its name. Any required params or query must be passed in the `options` argument.
   */
  resolve(
    location: MatcherLocationAsNamed,
    // TODO: is this useful?
    currentLocation?: undefined
    // currentLocation?: undefined | NEW_LocationResolved<TMatcherRecord>
  ): NEW_LocationResolved<TMatcherRecord>

  /**
   * Resolves a location by its absolute path (starts with `/`). Any required query must be passed.
   * @param location - The location to resolve.
   */
  resolve(
    location: MatcherLocationAsPathAbsolute,
    // TODO: is this useful?
    currentLocation?: undefined
    // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
  ): NEW_LocationResolved<TMatcherRecord>

  resolve(
    location: MatcherLocationAsPathRelative,
    currentLocation: NEW_LocationResolved<TMatcherRecord>
  ): NEW_LocationResolved<TMatcherRecord>

  // NOTE: in practice, this overload can cause bugs. It's better to use named locations

  /**
   * Resolves a location relative to another location. It reuses existing properties in the `currentLocation` like
   * `params`, `query`, and `hash`.
   */
  resolve(
    relativeLocation: MatcherLocationAsRelative,
    currentLocation: NEW_LocationResolved<TMatcherRecord>
  ): NEW_LocationResolved<TMatcherRecord>

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

  /**
   * Get a list of all matchers.
   * Previously named `getRoutes()`
   */
  getMatchers(): TMatcherRecord[]

  /**
   * Get a matcher by its name.
   * Previously named `getRecordMatcher()`
   */
  getMatcher(name: MatcherName): TMatcherRecord | undefined
}

/**
 * Allowed location objects to be passed to {@link NEW_RouterResolver['resolve']}
 */
export type MatcherLocationRaw =
  // | `/${string}`
  | string
  | MatcherLocationAsNamed
  | MatcherLocationAsPathAbsolute
  | MatcherLocationAsPathRelative
  | MatcherLocationAsRelative

export interface NEW_LocationResolved<TMatched> {
  // FIXME: remove `undefined`
  name: MatcherName | undefined
  // TODO: generics?
  params: MatcherParamsFormatted

  fullPath: string
  path: string
  query: LocationQuery
  hash: string

  matched: TMatched[]
}

export type MatcherPathParamsValue = string | null | string[]
/**
 * Params in a string format so they can be encoded/decoded and put into a URL.
 */
export type MatcherPathParams = Record<string, MatcherPathParamsValue>

export type MatcherQueryParamsValue = string | null | Array<string | null>
export type MatcherQueryParams = Record<string, MatcherQueryParamsValue>

/**
 * Apply a function to all properties in an object. It's used to encode/decode params and queries.
 * @internal
 */
export function applyFnToObject<R>(
  fn: (v: string | number | null | undefined) => R,
  params: MatcherPathParams | LocationQuery | undefined
): Record<string, R | R[]> {
  const newParams: Record<string, R | R[]> = {}

  for (const key in params) {
    const value = params[key]
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value)
  }

  return newParams
}

/**
 * Decode text using `decodeURIComponent`. Returns the original text if it
 * fails.
 *
 * @param text - string to decode
 * @returns decoded string
 */
export function decode(text: string | number): string
export function decode(text: null | undefined): null
export function decode(text: string | number | null | undefined): string | null
export function decode(
  text: string | number | null | undefined
): string | null {
  if (text == null) return null
  try {
    return decodeURIComponent('' + text)
  } catch (err) {
    __DEV__ && warn(`Error decoding "${text}". Using original value`)
  }
  return '' + text
}
// TODO: just add the null check to the original function in encoding.ts

interface FnStableNull {
  (value: null | undefined): null
  (value: string | number): string
  // needed for the general case and must be last
  (value: string | number | null | undefined): string | null
}

// function encodeParam(text: null | undefined, encodeSlash?: boolean): null
// function encodeParam(text: string | number, encodeSlash?: boolean): string
// function encodeParam(
//   text: string | number | null | undefined,
//   encodeSlash?: boolean
// ): string | null
// function encodeParam(
//   text: string | number | null | undefined,
//   encodeSlash = true
// ): string | null {
//   if (text == null) return null
//   text = encodePath(text)
//   return encodeSlash ? text.replace(SLASH_RE, '%2F') : text
// }

// @ts-expect-error: overload are not correctly identified
const encodeQueryValue: FnStableNull =
  // for ts
  value => (value == null ? null : _encodeQueryValue(value))

// // @ts-expect-error: overload are not correctly identified
// const encodeQueryKey: FnStableNull =
//   // for ts
//   value => (value == null ? null : _encodeQueryKey(value))

/**
 * Common properties for a location that couldn't be matched. This ensures
 * having the same name while having a `path`, `query` and `hash` that change.
 */
export const NO_MATCH_LOCATION = {
  name: __DEV__ ? Symbol('no-match') : Symbol(),
  params: {},
  matched: [],
} satisfies Omit<
  NEW_LocationResolved<unknown>,
  'path' | 'hash' | 'query' | 'fullPath'
>

// FIXME: later on, the MatcherRecord should be compatible with RouteRecordRaw (which can miss a path, have children, etc)

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
  name?: MatcherName

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

export interface NEW_MatcherRecordBase<T> {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  parent?: T
  children: T[]

  group?: boolean
  aliasOf?: NEW_MatcherRecord
  score: Array<number[]>
}

/**
 * Normalized version of a {@link NEW_MatcherRecordRaw} record.
 */
export interface NEW_MatcherRecord
  extends NEW_MatcherRecordBase<NEW_MatcherRecord> {}

/**
 * Tagged template helper to encode params into a path. Doesn't work with null
 */
export function pathEncoded(
  parts: TemplateStringsArray,
  ...params: Array<string | number | (string | number)[]>
): string {
  return parts.reduce((result, part, i) => {
    return (
      result +
      part +
      (Array.isArray(params[i])
        ? params[i].map(encodeParam).join('/')
        : encodeParam(params[i]))
    )
  })
}

// pathEncoded`/users/${1}`
// TODO:
// pathEncoded`/users/${null}/end`

// const a: RouteRecordRaw = {} as any

/**
 * Build the `matched` array of a record that includes all parent records from the root to the current one.
 */
function buildMatched<T extends NEW_MatcherRecordBase<T>>(record: T): T[] {
  const matched: T[] = []
  let node: T | undefined = record
  while (node) {
    matched.unshift(node)
    node = node.parent
  }
  return matched
}

export function createCompiledMatcher<
  TMatcherRecord extends NEW_MatcherRecordBase<TMatcherRecord>
>(
  records: NEW_MatcherRecordRaw[] = []
): NEW_RouterResolver<NEW_MatcherRecordRaw, TMatcherRecord> {
  // TODO: we also need an array that has the correct order
  const matcherMap = new Map<MatcherName, TMatcherRecord>()
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
        currentLocation: NEW_LocationResolved<TMatcherRecord>
      ]
    | [
        absoluteLocation: MatcherLocationAsPathAbsolute,
        // Same as above
        // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
        currentLocation?: undefined
      ]
    | [
        relativeLocation: MatcherLocationAsPathRelative,
        currentLocation: NEW_LocationResolved<TMatcherRecord>
      ]
    | [
        location: MatcherLocationAsNamed,
        // Same as above
        // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
        currentLocation?: undefined
      ]
    | [
        relativeLocation: MatcherLocationAsRelative,
        currentLocation: NEW_LocationResolved<TMatcherRecord>
      ]

  function resolve(
    ...args: MatcherResolveArgs
  ): NEW_LocationResolved<TMatcherRecord> {
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
      let matched: NEW_LocationResolved<TMatcherRecord>['matched'] | undefined
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

  function getMatchers() {
    return matchers
  }

  function getMatcher(name: MatcherName) {
    return matcherMap.get(name)
  }

  return {
    resolve,

    addMatcher,
    removeMatcher,
    clearMatchers,
    getMatcher,
    getMatchers,
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
function findInsertionIndex<T extends NEW_MatcherRecordBase<T>>(
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

function getInsertionAncestor<T extends NEW_MatcherRecordBase<T>>(matcher: T) {
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
function isAliasRecord<T extends NEW_MatcherRecordBase<T>>(
  record: T | undefined
): boolean {
  while (record) {
    if (record.aliasOf) return true
    record = record.parent
  }

  return false
}
