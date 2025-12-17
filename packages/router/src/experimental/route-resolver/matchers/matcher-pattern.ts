import { identityFn } from '../../../utils'
import { decode, encodeParam, encodePath } from '../../../encoding'
import { warn } from '../../../warning'
import { miss } from './errors'
import type { ParamParser } from './param-parsers/types'
import type { Simplify } from '../../../types/utils'

/**
 * Base interface for matcher patterns that extract params from a URL.
 *
 * @template TIn - type of the input value to match against the pattern
 * @template TParams - type of the output value after matching
 * @template TParamsRaw - type of the input value to build the input from
 *
 * In the case of the `path`, the `TIn` is a `string`, but in the case of the
 * query, it's the object of query params. `TParamsRaw` allows for a more permissive
 * type when building the value, for example allowing numbers and strings like
 * the old params.
 *
 * @internal this is the base interface for all matcher patterns, it shouldn't
 * be used directly
 */
export interface MatcherPattern<
  TIn = string,
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
  TParamsRaw extends MatcherParamsFormatted = TParams,
> {
  /**
   * Matches a serialized params value against the pattern.
   *
   * @param value - params value to parse
   * @throws {MatchMiss} if the value doesn't match
   * @returns parsed params object
   */
  match(value: TIn): TParams

  /**
   * Build a serializable value from parsed params. Should apply encoding if the
   * returned value is a string (e.g path and hash should be encoded but query
   * shouldn't).
   *
   * @param value - params value to parse
   * @returns serialized params value
   */
  build(params: TParamsRaw): TIn
}

/**
 * Handles the `path` part of a URL. It can transform a path string into an
 * object of params and vice versa.
 */
export interface MatcherPatternPath<
  // TODO: should we allow to not return anything? It's valid to spread null and undefined
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted, // | null // | undefined // | void // so it might be a bit more convenient
  TParamsRaw extends MatcherParamsFormatted = TParams,
> extends MatcherPattern<string, TParams, TParamsRaw> {}

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

  constructor(readonly path: string) {
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
export type MatcherPatternPathDynamic_ParamOptions<
  TUrlParam extends string | string[] | null = string | string[] | null,
  TParam = string | string[] | null,
  TParamRaw = TParam,
> = readonly [
  /**
   * Param parser to use for this param.
   */
  parser?: ParamParser<TParam, TUrlParam, TParamRaw>,

  /**
   * Is tha param a repeatable param and should be converted to an array
   */
  repeatable?: boolean,

  /**
   * Can this parameter be omitted or empty (for repeatable params, an empty array).
   */
  optional?: boolean,
]

/**
 * Helper type to extract the params from the options object.
 *
 * @internal
 */
type ExtractParamTypeFromOptions<TParamsOptions> = {
  [K in keyof TParamsOptions]: TParamsOptions[K] extends MatcherPatternPathDynamic_ParamOptions<
    any,
    infer TParam,
    any
  >
    ? TParam
    : never
}

/**
 * Helper type to extract the raw params from the options object.
 *
 * @internal
 */
type ExtractLocationParamTypeFromOptions<TParamsOptions> = {
  [K in keyof TParamsOptions]: TParamsOptions[K] extends MatcherPatternPathDynamic_ParamOptions<
    any,
    any,
    infer TParamRaw
  >
    ? TParamRaw
    : never
}

/**
 * Regex to remove trailing slashes from a path.
 *
 * @internal
 */
const TRAILING_SLASHES_RE = /\/*$/

/**
 * Handles the `path` part of a URL with dynamic parameters.
 */
export class MatcherPatternPathDynamic<TParamsOptions>
  implements
    MatcherPatternPath<
      ExtractParamTypeFromOptions<TParamsOptions>,
      ExtractLocationParamTypeFromOptions<TParamsOptions>
    >
{
  /**
   * Cached keys of the {@link params} object.
   */
  private paramsKeys: Array<keyof TParamsOptions>

  /**
   * Creates a new dynamic path matcher.
   *
   * @param re - regex to match the path against
   * @param params - object of param parsers as {@link MatcherPatternPathDynamic_ParamOptions}
   * @param pathParts - array of path parts, where strings are static parts, 1 are regular params, and 0 are splat params (not encode slash)
   * @param trailingSlash - whether the path should end with a trailing slash, null means "do not care" (for trailing splat params)
   */
  constructor(
    readonly re: RegExp,
    // NOTE: this version instead of extends allows the constructor
    // to properly infer the types of the params when using `new MatcherPatternPathCustomParams()`
    // otherwise, we need to use a factory function: https://github.com/microsoft/TypeScript/issues/40451
    readonly params: TParamsOptions &
      Record<string, MatcherPatternPathDynamic_ParamOptions<any, any>>,
    readonly pathParts: Array<string | number | Array<string | number>>,
    readonly trailingSlash: boolean | null = false
  ) {
    this.paramsKeys = Object.keys(this.params) as Array<keyof TParamsOptions>
  }

  match(path: string): Simplify<ExtractParamTypeFromOptions<TParamsOptions>> {
    if (
      this.trailingSlash != null &&
      this.trailingSlash === !path.endsWith('/')
    ) {
      throw miss()
    }

    const match = path.match(this.re)
    if (!match) {
      throw miss()
    }
    const params = {} as ExtractParamTypeFromOptions<TParamsOptions>
    for (var i = 0; i < this.paramsKeys.length; i++) {
      // var for performance in for loop
      var paramName = this.paramsKeys[i]
      var [parser, repeatable] = this.params[paramName]
      var currentMatch = (match[i + 1] as string | undefined) ?? null

      var value = repeatable
        ? (currentMatch?.split('/') || []).map<string>(decode)
        : decode(currentMatch)

      // we intentionally pass null and empty arrays to the parser
      // so they can better control the outcome
      params[paramName] = (parser?.get || identityFn)(value)
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

  build(
    params: Simplify<ExtractLocationParamTypeFromOptions<TParamsOptions>>
  ): string {
    let paramIndex = 0
    let paramName: keyof TParamsOptions
    let parser: (TParamsOptions &
      Record<
        string,
        MatcherPatternPathDynamic_ParamOptions<any, any>
      >)[keyof TParamsOptions][0]
    let repeatable: boolean | undefined
    let optional: boolean | undefined
    let value: ReturnType<NonNullable<ParamParser['set']>> | undefined
    const path =
      '/' +
      this.pathParts
        .map(part => {
          if (typeof part === 'string') {
            return part
          } else if (typeof part === 'number') {
            paramName = this.paramsKeys[paramIndex++]
            ;[parser, repeatable, optional] = this.params[paramName]
            value = (parser?.set || identityFn)(params[paramName])

            // non optional repeatable params cannot be empty
            if (Array.isArray(value) && !value.length && !optional) {
              throw miss()
            }

            return Array.isArray(value)
              ? value.map(encodeParam).join('/')
              : // part == 1 means a regular param, 0 means a splat
                (part ? encodeParam : encodePath)(value)
          } else {
            return part
              .map(subPart => {
                if (typeof subPart === 'string') {
                  return subPart
                }

                paramName = this.paramsKeys[paramIndex++]
                ;[parser, repeatable, optional] = this.params[paramName]
                value = (parser?.set || identityFn)(params[paramName])

                // param cannot be repeatable when in a sub segment
                if (__DEV__ && repeatable) {
                  warn(
                    `Param "${String(paramName)}" is repeatable, but used in a sub segment of the path: "${this.pathParts.join('')}". Repeated params can only be used as a full path segment: "/file/[ids]+/something-else". This will break in production.`
                  )
                  return Array.isArray(value)
                    ? value.map(encodeParam).join('/')
                    : encodeParam(value)
                }

                return encodeParam(value as string | null | undefined)
              })
              .join('')
          }
        })
        .filter(identityFn) // filter out empty values
        .join('/')

    /**
     * If the last part of the path is a splat param and its value is empty, it gets
     * filteretd out, resulting in a path that doesn't end with a `/` and doesn't even match
     * with the original splat path: e.g. /teams/[...pathMatch] does not match /teams, so it makes
     * no sense to build a path it cannot match.
     */
    return this.trailingSlash == null
      ? path + (!value && path.at(-1) !== '/' ? '/' : '')
      : path.replace(TRAILING_SLASHES_RE, this.trailingSlash ? '/' : '')
  }
}

/**
 * Handles the `hash` part of a URL. It can transform a hash string into an
 * object of params and vice versa.
 */
export interface MatcherPatternHash<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
> extends MatcherPattern<string, TParams> {}
// TODO: is this worth? It doesn't look like it is as it makes typing stricter but annoying
// > extends MatcherPattern<`#${string}` | '', TParams> {}

/**
 * Generic object of params that can be passed to a matcher.
 */
export type MatcherParamsFormatted = Record<string, unknown>

/**
 * Empty object in TS.
 */
export type EmptyParams = Record<PropertyKey, never>

/**
 * Possible values for query params in a matcher.
 */
export type MatcherQueryParamsValue =
  | string
  | null
  | undefined
  | Array<string | null>

export type MatcherQueryParams = Record<string, MatcherQueryParamsValue>
