import {
  type LocationQuery,
  parseQuery,
  normalizeQuery,
  stringifyQuery,
} from '../query'
import type {
  MatcherPatternHash,
  MatcherPatternPath,
  MatcherPatternQuery,
} from './matcher-pattern'
import { warn } from '../warning'
import { encodeQueryValue as _encodeQueryValue, encodeParam } from '../encoding'
import { parseURL, stringifyURL } from '../location'
import type {
  MatcherLocationAsNamed,
  MatcherLocationAsPathAbsolute,
  MatcherLocationAsPathRelative,
  MatcherLocationAsRelative,
  MatcherParamsFormatted,
} from './matcher-location'
import { _RouteRecordProps } from '../typed-routes'

/**
 * Allowed types for a matcher name.
 */
export type MatcherName = string | symbol

/**
 * Manage and resolve routes. Also handles the encoding, decoding, parsing and serialization of params, query, and hash.
 * `TMatcherRecordRaw` represents the raw record type passed to {@link addRoute}.
 * `TMatcherRecord` represents the normalized record type.
 */
export interface NEW_RouterMatcher<TMatcherRecordRaw, TMatcherRecord> {
  /**
   * Resolves an absolute location (like `/path/to/somewhere`).
   */
  resolve(
    absoluteLocation: `/${string}`,
    currentLocation?: undefined | NEW_LocationResolved<TMatcherRecord>
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
    location: MatcherLocationAsNamed
  ): NEW_LocationResolved<TMatcherRecord>

  /**
   * Resolves a location by its absolute path (starts with `/`). Any required query must be passed.
   * @param location - The location to resolve.
   */
  resolve(
    location: MatcherLocationAsPathAbsolute
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

  addRoute(matcher: TMatcherRecordRaw, parent?: TMatcherRecord): TMatcherRecord
  removeRoute(matcher: TMatcherRecord): void
  clearRoutes(): void

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
 * Allowed location objects to be passed to {@link NEW_RouterMatcher['resolve']}
 */
export type MatcherLocationRaw =
  | `/${string}`
  | string
  | MatcherLocationAsNamed
  | MatcherLocationAsPathAbsolute
  | MatcherLocationAsPathRelative
  | MatcherLocationAsRelative

/**
 * Matcher capable of adding and removing routes at runtime.
 */
export interface NEW_Matcher_Dynamic {
  addRoute(record: TODO, parent?: TODO): () => void

  removeRoute(record: TODO): void
  removeRoute(name: MatcherName): void

  clearRoutes(): void
}

type TODO = any

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
 * Experiment new matcher record base type.
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
}

/**
 * Normalized version of a {@link NEW_MatcherRecordRaw} record.
 */
export interface NEW_MatcherRecord {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  parent?: NEW_MatcherRecord
}

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
function buildMatched(record: NEW_MatcherRecord): NEW_MatcherRecord[] {
  const matched: NEW_MatcherRecord[] = []
  let node: NEW_MatcherRecord | undefined = record
  while (node) {
    matched.unshift(node)
    node = node.parent
  }
  return matched
}

export function createCompiledMatcher(
  records: NEW_MatcherRecordRaw[] = []
): NEW_RouterMatcher<NEW_MatcherRecordRaw, NEW_MatcherRecord> {
  // TODO: we also need an array that has the correct order
  const matchers = new Map<MatcherName, NEW_MatcherRecord>()

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
    | [
        absoluteLocation: `/${string}`,
        currentLocation?: undefined | NEW_LocationResolved<NEW_MatcherRecord>
      ]
    | [
        relativeLocation: string,
        currentLocation: NEW_LocationResolved<NEW_MatcherRecord>
      ]
    | [absoluteLocation: MatcherLocationAsPathAbsolute]
    | [
        relativeLocation: MatcherLocationAsPathRelative,
        currentLocation: NEW_LocationResolved<NEW_MatcherRecord>
      ]
    | [location: MatcherLocationAsNamed]
    | [
        relativeLocation: MatcherLocationAsRelative,
        currentLocation: NEW_LocationResolved<NEW_MatcherRecord>
      ]

  function resolve(
    ...args: MatcherResolveArgs
  ): NEW_LocationResolved<NEW_MatcherRecord> {
    const [location, currentLocation] = args

    // string location, e.g. '/foo', '../bar', 'baz', '?page=1'
    if (typeof location === 'string') {
      // parseURL handles relative paths
      const url = parseURL(parseQuery, location, currentLocation?.path)

      let matcher: NEW_MatcherRecord | undefined
      let matched:
        | NEW_LocationResolved<NEW_MatcherRecord>['matched']
        | undefined
      let parsedParams: MatcherParamsFormatted | null | undefined

      for (matcher of matchers.values()) {
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
          query: url.query,
          hash: url.hash,
        }
      }

      return {
        ...url,
        // matcher exists if matched exists
        name: matcher!.name,
        params: parsedParams,
        // already decoded
        query: url.query,
        hash: url.hash,
        matched,
      }
      // TODO: handle object location { path, query, hash }
    } else {
      // relative location or by name
      if (__DEV__ && location.name == null && currentLocation == null) {
        console.warn(
          `Cannot resolve an unnamed relative location without a current location. This will throw in production.`,
          location
        )
        const query = normalizeQuery(location.query)
        const hash = location.hash ?? ''
        const path = location.path ?? '/'
        return {
          ...NO_MATCH_LOCATION,
          fullPath: stringifyURL(stringifyQuery, { path, query, hash }),
          path,
          query,
          hash,
        }
      }

      // either one of them must be defined and is catched by the dev only warn above
      const name = location.name ?? currentLocation!.name
      // FIXME: remove once name cannot be null
      const matcher = name != null && matchers.get(name)
      if (!matcher) {
        throw new Error(`Matcher "${String(location.name)}" not found`)
      }

      // unencoded params in a formatted form that the user came up with
      const params: MatcherParamsFormatted = {
        ...currentLocation?.params,
        ...location.params,
      }
      const path = matcher.path.build(params)
      const hash = matcher.hash?.build(params) ?? ''
      const matched = buildMatched(matcher)
      const query = Object.assign(
        {
          ...currentLocation?.query,
          ...normalizeQuery(location.query),
        },
        ...matched.map(matcher => matcher.query?.build(params))
      )

      return {
        name,
        fullPath: stringifyURL(stringifyQuery, { path, query, hash }),
        path,
        query,
        hash,
        params,
        matched,
      }
    }
  }

  function addRoute(record: NEW_MatcherRecordRaw, parent?: NEW_MatcherRecord) {
    const name = record.name ?? (__DEV__ ? Symbol('unnamed-route') : Symbol())
    // FIXME: proper normalization of the record
    const normalizedRecord: NEW_MatcherRecord = {
      ...record,
      name,
      parent,
    }
    matchers.set(name, normalizedRecord)
    return normalizedRecord
  }

  for (const record of records) {
    addRoute(record)
  }

  function removeRoute(matcher: NEW_MatcherRecord) {
    matchers.delete(matcher.name)
    // TODO: delete children and aliases
  }

  function clearRoutes() {
    matchers.clear()
  }

  function getMatchers() {
    return Array.from(matchers.values())
  }

  function getMatcher(name: MatcherName) {
    return matchers.get(name)
  }

  return {
    resolve,

    addRoute,
    removeRoute,
    clearRoutes,
    getMatcher,
    getMatchers,
  }
}
