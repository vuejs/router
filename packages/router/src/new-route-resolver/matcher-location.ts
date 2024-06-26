import type { LocationQueryRaw } from '../query'
import type { MatcherName } from './matcher'

// the matcher can serialize and deserialize params
export type MatcherParamsFormatted = Record<string, unknown>

export interface MatcherLocationAsName {
  name: MatcherName
  params: MatcherParamsFormatted
  query?: LocationQueryRaw
  hash?: string

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
