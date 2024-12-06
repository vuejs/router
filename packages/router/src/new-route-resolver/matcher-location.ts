import type { LocationQueryRaw } from '../query'
import type { MatcherName } from './matcher'

/**
 * Generic object of params that can be passed to a matcher.
 */
export type MatcherParamsFormatted = Record<string, unknown>

export interface MatcherLocationAsName {
  name: MatcherName
  params: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

  /**
   * A path is ignored if `name` is provided.
   */
  path?: undefined
}

export interface MatcherLocationAsPath {
  path: string
  query?: LocationQueryRaw
  hash?: string

  name?: undefined
  params?: undefined
}

export interface MatcherLocationAsRelative {
  params?: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

  name?: undefined
  path?: undefined
}
