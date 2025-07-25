import { type LocationQuery, type LocationQueryRaw } from '../../query'
import { warn } from '../../warning'
import {
  encodeQueryValue as _encodeQueryValue,
  encodeParam,
} from '../../encoding'
import type { MatcherParamsFormatted } from './matchers/matcher-pattern'
import { _RouteRecordProps } from '../../typed-routes'
import { NEW_MatcherDynamicRecord } from './resolver-dynamic'

/**
 * Allowed types for a matcher name.
 */
export type RecordName = string | symbol

/**
 * Manage and resolve routes. Also handles the encoding, decoding, parsing and
 * serialization of params, query, and hash.
 *
 * - `TMatcherRecordRaw` represents the raw record type passed to {@link addMatcher}.
 * - `TMatcherRecord` represents the normalized record type returned by {@link getRecords}.
 */
export interface NEW_RouterResolver_Base<TRecord> {
  /**
   * Resolves an absolute location (like `/path/to/somewhere`).
   *
   * @param absoluteLocation - The absolute location to resolve.
   * @param currentLocation - This value is ignored and should not be passed if the location is absolute.
   */
  resolve(
    absoluteLocation: `/${string}`,
    currentLocation?: undefined
  ): ResolverLocationResolved<TRecord>

  /**
   * Resolves a string location relative to another location. A relative location can be `./same-folder`,
   * `../parent-folder`, `same-folder`, or even `?page=2`.
   */
  resolve(
    relativeLocation: string,
    currentLocation: ResolverLocationResolved<TRecord>
  ): ResolverLocationResolved<TRecord>

  /**
   * Resolves a location by its name. Any required params or query must be passed in the `options` argument.
   */
  resolve(
    location: ResolverLocationAsNamed,
    // TODO: is this useful?
    currentLocation?: undefined
    // currentLocation?: undefined | NEW_LocationResolved<TMatcherRecord>
  ): ResolverLocationResolved<TRecord>

  /**
   * Resolves a location by its absolute path (starts with `/`). Any required query must be passed.
   * @param location - The location to resolve.
   */
  resolve(
    location: ResolverLocationAsPathAbsolute,
    // TODO: is this useful?
    currentLocation?: undefined
    // currentLocation?: NEW_LocationResolved<TMatcherRecord> | undefined
  ): ResolverLocationResolved<TRecord>

  resolve(
    location: ResolverLocationAsPathRelative,
    currentLocation: ResolverLocationResolved<TRecord>
  ): ResolverLocationResolved<TRecord>

  // NOTE: in practice, this overload can cause bugs. It's better to use named locations

  /**
   * Resolves a location relative to another location. It reuses existing properties in the `currentLocation` like
   * `params`, `query`, and `hash`.
   */
  resolve(
    relativeLocation: ResolverLocationAsRelative,
    currentLocation: ResolverLocationResolved<TRecord>
  ): ResolverLocationResolved<TRecord>

  /**
   * Get a list of all resolver records.
   * Previously named `getRoutes()`
   */
  getRecords(): TRecord[]

  /**
   * Get a resolver record by its name.
   * Previously named `getRecordMatcher()`
   */
  getRecord(name: RecordName): TRecord | undefined
}

/**
 * Allowed location objects to be passed to {@link NEW_RouterResolver['resolve']}
 */
export type MatcherLocationRaw =
  // | `/${string}`
  | string
  | ResolverLocationAsNamed
  | ResolverLocationAsPathAbsolute
  | ResolverLocationAsPathRelative
  | ResolverLocationAsRelative

/**
 * Returned location object by {@link NEW_RouterResolver['resolve']}.
 * It contains the resolved name, params, query, hash, and matched records.
 */
export interface ResolverLocationResolved<TMatched> {
  name: RecordName
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

// TODO: move to matcher-pattern
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
  ResolverLocationResolved<unknown>,
  'path' | 'hash' | 'query' | 'fullPath'
>

/**
 * Normalized version of a {@link NEW_MatcherRecordRaw} record.
 */
export interface NEW_MatcherRecord extends NEW_MatcherDynamicRecord {}

// FIXME: move somewhere else
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
export interface ResolverLocationAsNamed {
  name: RecordName
  // FIXME: should this be optional?
  params: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

  /**
   * @deprecated This is ignored when `name` is provided
   */
  path?: undefined
}
export interface ResolverLocationAsPathRelative {
  path: string
  query?: LocationQueryRaw
  hash?: string

  /**
   * @deprecated This is ignored when `path` is provided
   */
  name?: undefined
  /**
   * @deprecated This is ignored when `path` (instead of `name`) is provided
   */
  params?: undefined
} // TODO: does it make sense to support absolute paths objects?

export interface ResolverLocationAsPathAbsolute
  extends ResolverLocationAsPathRelative {
  path: `/${string}`
}
export interface ResolverLocationAsRelative {
  params?: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

  /**
   * @deprecated This location is relative to the next parameter. This `name` will be ignored.
   */
  name?: undefined
  /**
   * @deprecated This location is relative to the next parameter. This `path` will be ignored.
   */
  path?: undefined
}
