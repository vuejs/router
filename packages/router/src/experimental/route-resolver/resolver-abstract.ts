import { type LocationQueryRaw } from '../../query'
import {
  encodeQueryValue as _encodeQueryValue,
  encodeParam,
} from '../../encoding'
import type { MatcherParamsFormatted } from './matchers/matcher-pattern'
import type { _RouteRecordProps } from '../../typed-routes'
import type { LocationNormalized } from '../../location'

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
export interface EXPERIMENTAL_Resolver_Base<TRecord> {
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
   * Resolves a string location relative to another location. A relative
   * location can be `./same-folder`, `../parent-folder`, `same-folder`, or
   * even `?page=2`.
   */
  resolve(
    relativeLocation: string,
    currentLocation: ResolverLocationResolved<TRecord>
  ): ResolverLocationResolved<TRecord>

  /**
   * Resolves a location by its name. Any required params or query must be
   * passed in the `options` argument.
   */
  resolve(
    location: ResolverLocationAsNamed,
    // TODO: is this useful?
    currentLocation?: undefined
    // currentLocation?: undefined | NEW_LocationResolved<TMatcherRecord>
  ): ResolverLocationResolved<TRecord>

  /**
   * Resolves a location by its absolute path (starts with `/`). Any required query must be passed.
   *
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
   * Resolves a location relative to another location. It reuses existing
   * properties in the `currentLocation` like `params`, `query`, and `hash`.
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
 * Allowed location objects to be passed to {@link EXPERIMENTAL_Resolver_Base['resolve']}
 */
export type MatcherLocationRaw =
  // | `/${string}`
  | string
  | ResolverLocationAsNamed
  | ResolverLocationAsPathAbsolute
  | ResolverLocationAsPathRelative
  | ResolverLocationAsRelative

/**
 * Returned location object by {@link EXPERIMENTAL_Resolver_Base['resolve']}.
 * It contains the resolved name, params, query, hash, and matched records.
 */
export interface ResolverLocationResolved<TMatched> extends LocationNormalized {
  /**
   * Name of the route record. A symbol if no name is provided.
   */
  name: RecordName

  /**
   * Parsed params. Already decoded and formatted.
   */
  params: MatcherParamsFormatted

  /**
   * Chain of route records that lead to the matched one. The last record is
   * the the one that matched the location. Each previous record is the parent
   * of the next one.
   */
  matched: TMatched[]
}

/**
 * Common properties for a location that couldn't be matched. This ensures
 * having the same name while having a `path`, `query` and `hash` that change.
 */
export const NO_MATCH_LOCATION = {
  name: __DEV__ ? Symbol('no-match') : Symbol(),
  params: {},
  matched: [],
} satisfies Omit<ResolverLocationResolved<never>, keyof LocationNormalized>

/**
 * Location object that can be passed to {@link
 * EXPERIMENTAL_Resolver_Base['resolve']} and is recognized as a `name`.
 *
 * @example
 * ```ts
 * resolver.resolve({ name: 'user', params: { id: 123 } })
 * resolver.resolve({ name: 'user-search', params: {}, query: { page: 2 } })
 * ```
 */
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

/**
 * Location object that can be passed to {@link EXPERIMENTAL_Resolver_Base['resolve']}
 * and is recognized as a relative path.
 *
 * @example
 * ```ts
 * resolver.resolve({ path: './123' }, currentLocation)
 * resolver.resolve({ path: '..' }, currentLocation)
 * ```
 */
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
}

// TODO: does it make sense to support absolute paths objects?

/**
 * Location object that can be passed to {@link EXPERIMENTAL_Resolver_Base['resolve']}
 * and is recognized as an absolute path.
 *
 * @example
 * ```ts
 * resolver.resolve({ path: '/team/123' })
 * ```
 */
export interface ResolverLocationAsPathAbsolute
  extends ResolverLocationAsPathRelative {
  path: `/${string}`
}

/**
 * Relative location object that can be passed to {@link EXPERIMENTAL_Resolver_Base['resolve']}
 * and is recognized as a relative location, copying the `params`, `query`, and
 * `hash` if not provided.
 *
 * @example
 * ```ts
 * resolver.resolve({ params: { id: 123 } }, currentLocation)
 * resolver.resolve({ hash: '#bottom' }, currentLocation)
 * ```
 */
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
