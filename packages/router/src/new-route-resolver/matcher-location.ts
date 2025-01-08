import type { LocationQueryRaw } from '../query'
import type { MatcherName } from './resolver'

/**
 * Generic object of params that can be passed to a matcher.
 */
export type MatcherParamsFormatted = Record<string, unknown>

/**
 * Empty object in TS.
 */
export type EmptyParams = Record<PropertyKey, never>

export interface MatcherLocationAsNamed {
  name: MatcherName
  // FIXME: should this be optional?
  params: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

  /**
   * @deprecated This is ignored when `name` is provided
   */
  path?: undefined
}

export interface MatcherLocationAsPathRelative {
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
export interface MatcherLocationAsPathAbsolute
  extends MatcherLocationAsPathRelative {
  path: `/${string}`
}

export interface MatcherLocationAsRelative {
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
