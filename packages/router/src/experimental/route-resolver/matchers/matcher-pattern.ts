import { identityFn } from '../../../utils'
import { encodeParam } from '../../../encoding'
import { warn } from '../../../warning'
import { decode, MatcherQueryParams } from '../resolver-abstract'
import { miss } from './errors'
import { ParamParser } from './param-parsers/types'

/**
 * Base interface for matcher patterns that extract params from a URL.
 *
 * @template TIn - type of the input value to match against the pattern
 * @template TOut - type of the output value after matching
 *
 * In the case of the `path`, the `TIn` is a `string`, but in the case of the
 * query, it's the object of query params.
 *
 * @internal this is the base interface for all matcher patterns, it shouldn't
 * be used directly
 */
export interface MatcherPattern<
  TIn = string,
  TOut extends MatcherParamsFormatted = MatcherParamsFormatted,
> {
  /**
   * Matches a serialized params value against the pattern.
   *
   * @param value - params value to parse
   * @throws {MatchMiss} if the value doesn't match
   * @returns parsed params object
   */
  match(value: TIn): TOut

  /**
   * Build a serializable value from parsed params. Should apply encoding if the
   * returned value is a string (e.g path and hash should be encoded but query
   * shouldn't).
   *
   * @param value - params value to parse
   * @returns serialized params value
   */
  build(params: TOut): TIn
}

/**
 * Handles the `path` part of a URL. It can transform a path string into an
 * object of params and vice versa.
 */
export interface MatcherPatternPath<
  // TODO: should we allow to not return anything? It's valid to spread null and undefined
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted, // | null // | undefined // | void // so it might be a bit more convenient
> extends MatcherPattern<string, TParams> {}

/**
 * Allows matching a static path.
 *
 * @example
 * ```ts
 * const matcher = new MatcherPatternPathStatic('/team')
 * matcher.match('/team') // {}
 * matcher.match('/team/123') // throws MatchMiss
 * matcher.build() // '/team'
 * ```
 */
export class MatcherPatternPathStatic
  implements MatcherPatternPath<EmptyParams>
{
  /**
   * lowercase version of the path to match against.
   * This is used to make the matching case insensitive.
   */
  private pathi: string

  constructor(private path: string) {
    this.pathi = path.toLowerCase()
  }

  match(path: string): EmptyParams {
    if (path.toLowerCase() !== this.pathi) {
      throw miss()
    }
    return {}
  }

  build(): string {
    return this.path
  }
}

/**
 * Options for param parsers in {@link MatcherPatternPathDynamic}.
 */
export interface MatcherPatternPathDynamic_ParamOptions<
  TIn extends string | string[] | null = string | string[] | null,
  TOut = string | string[] | null,
> extends ParamParser<TOut, TIn> {
  repeat?: boolean
  // NOTE: not needed because in the regexp, the value is undefined if
  // the group is optional and not given
  // optional?: boolean
}

/**
 * Helper type to extract the params from the options object.
 * @internal
 */
type ExtractParamTypeFromOptions<TParamsOptions> = {
  [K in keyof TParamsOptions]: TParamsOptions[K] extends MatcherPatternPathDynamic_ParamOptions<
    any,
    infer TOut
  >
    ? TOut
    : never
}

/**
 * Handles the `path` part of a URL with dynamic parameters.
 */
export class MatcherPatternPathDynamic<
  TParamsOptions,
  // TODO: | EmptyObject ?
  // TParamsOptions extends Record<string, MatcherPatternPathCustomParamOptions>,
  // TParams extends MatcherParamsFormatted = ExtractParamTypeFromOptions<TParamsOptions>
> implements MatcherPatternPath<ExtractParamTypeFromOptions<TParamsOptions>>
{
  /**
   * Cached keys of the {@link params} object.
   */
  private paramsKeys: Array<keyof TParamsOptions>

  constructor(
    readonly re: RegExp,
    // NOTE: this version instead of extends allows the constructor
    // to properly infer the types of the params when using `new MatcherPatternPathCustomParams()`
    // otherwise, we need to use a factory function: https://github.com/microsoft/TypeScript/issues/40451
    readonly params: TParamsOptions &
      Record<string, MatcherPatternPathDynamic_ParamOptions<any, any>>,
    // A better version could be using all the parts to join them
    // .e.g ['users', 0, 'profile', 1] -> /users/123/profile/456
    // numbers are indexes of the params in the params object keys
    readonly pathParts: Array<string | number | Array<string | number>>
  ) {
    this.paramsKeys = Object.keys(this.params) as Array<keyof TParamsOptions>
  }

  match(path: string): ExtractParamTypeFromOptions<TParamsOptions> {
    const match = path.match(this.re)
    if (!match) {
      throw miss()
    }
    const params = {} as ExtractParamTypeFromOptions<TParamsOptions>
    for (var i = 0; i < this.paramsKeys.length; i++) {
      // var for performance in for loop
      var paramName = this.paramsKeys[i]
      var paramOptions = this.params[paramName]
      var currentMatch = (match[i + 1] as string | undefined) ?? null

      var value = paramOptions.repeat
        ? (currentMatch?.split('/') || []).map<string>(decode)
        : decode(currentMatch)

      params[paramName] = (paramOptions.get || identityFn)(value)
    }

    if (
      __DEV__ &&
      Object.keys(params).length !== Object.keys(this.params).length
    ) {
      warn(
        `Regexp matched ${match.length} params, but ${i} params are defined. Found when matching "${path}" against ${String(this.re)}`
      )
    }

    return params
  }

  build(params: ExtractParamTypeFromOptions<TParamsOptions>): string {
    let paramIndex = 0
    return (
      '/' +
      this.pathParts
        .map(part => {
          if (typeof part === 'string') {
            return part
          } else if (typeof part === 'number') {
            const paramName = this.paramsKeys[paramIndex++]
            const paramOptions = this.params[paramName]
            const value: ReturnType<NonNullable<ParamParser['set']>> = (
              paramOptions.set || identityFn
            )(params[paramName])

            return Array.isArray(value)
              ? value.map(encodeParam).join('/')
              : encodeParam(value)
          } else {
            return part
              .map(subPart => {
                if (typeof subPart === 'string') {
                  return subPart
                }

                const paramName = this.paramsKeys[paramIndex++]
                const paramOptions = this.params[paramName]
                const value: ReturnType<NonNullable<ParamParser['set']>> = (
                  paramOptions.set || identityFn
                )(params[paramName])

                return Array.isArray(value)
                  ? value.map(encodeParam).join('/')
                  : encodeParam(value)
              })
              .join('')
          }
        })
        .filter(identityFn) // filter out empty values
        .join('/')
    )
  }
}

/**
 * Handles the `query` part of a URL. It can transform a query object into an
 * object of params and vice versa.
 */
export interface MatcherPatternQuery<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
> extends MatcherPattern<MatcherQueryParams, TParams> {}

/**
 * Handles the `hash` part of a URL. It can transform a hash string into an
 * object of params and vice versa.
 */
export interface MatcherPatternHash<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
> extends MatcherPattern<string, TParams> {}

/**
 * Generic object of params that can be passed to a matcher.
 */
export type MatcherParamsFormatted = Record<string, unknown>

/**
 * Empty object in TS.
 */
export type EmptyParams = Record<PropertyKey, never>
