import type {
  MatcherName,
  MatcherPathParams,
  MatcherQueryParams,
  MatcherQueryParamsValue,
} from './matcher'
import type { MatcherParamsFormatted } from './matcher-location'

/**
 * Allows to match, extract, parse and build a path. Tailored to iterate through route records and check if a location
 * matches. When it cannot match, it returns `null` instead of throwing to not force a try/catch block around each
 * iteration in for loops. Not meant to handle encoding/decoding. It expects different parts of the URL to be either
 * encoded or decoded depending on the method.
 */
export interface MatcherPattern {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  // TODO: add route record to be able to build the matched

  /**
   * Extracts from an unencoded, parsed params object the ones belonging to the path, query, and hash in their
   * serialized format but still unencoded. e.g. `{ id: 2 }` -> `{ id: '2' }`. If any params are missing, return `null`.
   *
   * @param params - Params to extract from. If any params are missing, throws
   */
  matchParams(
    params: MatcherParamsFormatted
  ):
    | readonly [
        pathParams: MatcherPathParams,
        queryParams: MatcherQueryParams,
        hashParam: string
      ]
    | null

  /**
   * Extracts the defined params from an encoded path, decoded query, and decoded hash parsed from a URL. Does not apply
   * formatting or decoding. If the URL does not match the pattern, returns `null`.
   *
   * @example
   * ```ts
   * const pattern = createPattern('/foo', {
   *   path: {}, // nothing is used from the path
   *   query: { used: String }, // we require a `used` query param
   * })
   * // /?used=2
   * pattern.parseLocation({ path: '/', query: { used: '' }, hash: '' }) // null
   * // /foo?used=2&notUsed&notUsed=2#hello
   * pattern.parseLocation({ path: '/foo', query: { used: '2', notUsed: [null, '2']}, hash: '#hello' })
   * // { used: '2' } // we extract the required params
   * // /foo?used=2#hello
   * pattern.parseLocation({ path: '/foo', query: {}, hash: '#hello' })
   * // null // the query param is missing
   * ```
   *
   * @param location - URL parts to extract from
   * @param location.path - encoded path
   * @param location.query - decoded query
   * @param location.hash - decoded hash
   */
  matchLocation(location: {
    path: string
    query: MatcherQueryParams
    hash: string
  }):
    | readonly [
        pathParams: MatcherPathParams,
        queryParams: MatcherQueryParams,
        hashParam: string
      ]
    | null

  /**
   * Takes encoded params object to form the `path`,
   *
   * @param pathParams - encoded path params
   */
  buildPath(pathParams: MatcherPathParams): string

  /**
   * Runs the decoded params through the parsing functions if any, allowing them to be in be of a type other than a
   * string.
   *
   * @param pathParams - decoded path params
   * @param queryParams - decoded query params
   * @param hashParam - decoded hash param
   */
  parseParams(
    pathParams: MatcherPathParams,
    queryParams: MatcherQueryParams,
    hashParam: string
  ): MatcherParamsFormatted | null
}

interface PatternParamOptions_Base<T = unknown> {
  get: (value: MatcherQueryParamsValue) => T
  set?: (value: T) => MatcherQueryParamsValue
  default?: T | (() => T)
}

export interface PatternPathParamOptions<T = unknown>
  extends PatternParamOptions_Base<T> {
  re: RegExp
  keys: string[]
}

export interface PatternQueryParamOptions<T = unknown>
  extends PatternParamOptions_Base<T> {
  get: (value: MatcherQueryParamsValue) => T
  set?: (value: T) => MatcherQueryParamsValue
}

// TODO: allow more than strings
export interface PatternHashParamOptions
  extends PatternParamOptions_Base<string> {}

export interface MatcherPatternPath {
  buildPath(path: MatcherPathParams): string
  match(path: string): MatcherPathParams
  parse?(params: MatcherPathParams): MatcherParamsFormatted
  serialize?(params: MatcherParamsFormatted): MatcherPathParams
}

export interface MatcherPatternQuery {
  match(query: MatcherQueryParams): MatcherQueryParams
  parse(params: MatcherQueryParams): MatcherParamsFormatted
  serialize(params: MatcherParamsFormatted): MatcherQueryParams
}

export interface MatcherPatternHash {
  /**
   * Check if the hash matches a pattern and returns it, still encoded with its leading `#`.
   * @param hash - encoded hash
   */
  match(hash: string): string
  parse(hash: string): MatcherParamsFormatted
  serialize(params: MatcherParamsFormatted): string
}

export class MatcherPatternImpl implements MatcherPattern {
  constructor(
    public name: MatcherName,
    private path: MatcherPatternPath,
    private query?: MatcherPatternQuery,
    private hash?: MatcherPatternHash
  ) {}

  matchLocation(location: {
    path: string
    query: MatcherQueryParams
    hash: string
  }) {
    // TODO: is this performant? bench compare to a check with `null
    try {
      return [
        this.path.match(location.path),
        this.query?.match(location.query) ?? {},
        this.hash?.match(location.hash) ?? '',
      ] as const
    } catch {
      return null
    }
  }

  parseParams(
    path: MatcherPathParams,
    query: MatcherQueryParams,
    hash: string
  ): MatcherParamsFormatted {
    return {
      ...this.path.parse?.(path),
      ...this.query?.parse(query),
      ...this.hash?.parse(hash),
    }
  }

  buildPath(path: MatcherPathParams): string {
    return this.path.buildPath(path)
  }

  matchParams(
    params: MatcherParamsFormatted
  ): [path: MatcherPathParams, query: MatcherQueryParams, hash: string] {
    return [
      this.path.serialize?.(params) ?? {},
      this.query?.serialize(params) ?? {},
      this.hash?.serialize(params) ?? '',
    ]
  }
}
