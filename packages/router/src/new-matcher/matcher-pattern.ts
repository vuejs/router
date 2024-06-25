import type {
  MatcherName,
  MatcherPathParams,
  MatcherQueryParams,
  MatcherQueryParamsValue,
} from './matcher'
import type { MatcherParamsFormatted } from './matcher-location'

export interface MatcherPattern {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  /**
   * Extracts from a formatted, unencoded params object the ones belonging to the path, query, and hash. If any of them is missing, returns `null`. TODO: throw instead?
   * @param params - Params to extract from.
   */
  unformatParams(
    params: MatcherParamsFormatted
  ): [path: MatcherPathParams, query: MatcherQueryParams, hash: string | null]

  /**
   * Extracts the defined params from an encoded path, query, and hash parsed from a URL. Does not apply formatting or
   * decoding. If the URL does not match the pattern, returns `null`.
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
   */
  matchLocation(location: {
    path: string
    query: MatcherQueryParams
    hash: string
  }): [path: MatcherPathParams, query: MatcherQueryParams, hash: string | null]

  /**
   * Takes encoded params object to form the `path`,
   * @param path - encoded path params
   */
  buildPath(path: MatcherPathParams): string

  /**
   * Runs the decoded params through the formatting functions if any.
   * @param params - Params to format.
   */
  formatParams(
    path: MatcherPathParams,
    query: MatcherQueryParams,
    hash: string | null
  ): MatcherParamsFormatted
}

interface PatternParamOptions_Base<T = unknown> {
  get: (value: MatcherQueryParamsValue) => T
  set?: (value: T) => MatcherQueryParamsValue
  default?: T | (() => T)
}

export interface PatternParamOptions extends PatternParamOptions_Base {}

export interface PatternQueryParamOptions<T = unknown>
  extends PatternParamOptions_Base<T> {
  get: (value: MatcherQueryParamsValue) => T
  set?: (value: T) => MatcherQueryParamsValue
}

// TODO: allow more than strings
export interface PatternHashParamOptions
  extends PatternParamOptions_Base<string> {}

export interface MatcherPatternPath {
  match(path: string): MatcherPathParams
  format(params: MatcherPathParams): MatcherParamsFormatted
}

export interface MatcherPatternQuery {
  match(query: MatcherQueryParams): MatcherQueryParams
  format(params: MatcherQueryParams): MatcherParamsFormatted
}

export interface MatcherPatternHash {
  /**
   * Check if the hash matches a pattern and returns it, still encoded with its leading `#`.
   * @param hash - encoded hash
   */
  match(hash: string): string
  format(hash: string): MatcherParamsFormatted
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
  }): [path: MatcherPathParams, query: MatcherQueryParams, hash: string] {
    return [
      this.path.match(location.path),
      this.query?.match(location.query) ?? {},
      this.hash?.match(location.hash) ?? '',
    ]
  }

  formatParams(
    path: MatcherPathParams,
    query: MatcherQueryParams,
    hash: string
  ): MatcherParamsFormatted {
    return {
      ...this.path.format(path),
      ...this.query?.format(query),
      ...this.hash?.format(hash),
    }
  }

  buildPath(path: MatcherPathParams): string {
    return ''
  }

  unformatParams(
    params: MatcherParamsFormatted
  ): [path: MatcherPathParams, query: MatcherQueryParams, hash: string | null] {
    throw new Error('Method not implemented.')
  }
}
