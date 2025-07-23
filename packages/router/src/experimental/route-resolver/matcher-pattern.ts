import { decode, MatcherQueryParams } from './resolver'
import { EmptyParams, MatcherParamsFormatted } from './matcher-location'
import { miss } from './matchers/errors'

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
  private path: string
  constructor(path: string) {
    this.path = path.toLowerCase()
  }

  match(path: string): EmptyParams {
    if (path.toLowerCase() !== this.path) {
      throw miss()
    }
    return {}
  }

  build(): string {
    return this.path
  }
}

/**
 * Allows matching a static path folllowed by anything.
 *
 * @example
 *
 * ```ts
 * const matcher = new MatcherPatternPathStar('/team')
 * matcher.match('/team/123') // { pathMatch: '/123' }
 * matcher.match('/team-123') // { pathMatch: '-123' }
 * matcher.match('/team') // { pathMatch: '' }
 * matcher.build({ pathMatch: '/123' }) // '/team/123'
 * ```
 */
export class MatcherPatternPathStar
  implements MatcherPatternPath<{ pathMatch: string }>
{
  private path: string
  constructor(path: string = '') {
    this.path = path.toLowerCase()
  }

  match(path: string): { pathMatch: string } {
    const pathMatchIndex = path.toLowerCase().indexOf(this.path)
    if (pathMatchIndex < 0) {
      throw miss()
    }
    return {
      pathMatch: path.slice(pathMatchIndex + this.path.length),
    }
  }

  build(params: { pathMatch: string }): string {
    return this.path + params.pathMatch
  }
}

// example of a static matcher built at runtime
// new MatcherPatternPathStatic('/')
// new MatcherPatternPathStatic('/team')

export interface Param_GetSet<
  TIn extends string | string[] = string | string[],
  TOut = TIn,
> {
  get?: (value: NoInfer<TIn>) => TOut
  set?: (value: NoInfer<TOut>) => TIn
}

export type ParamParser_Generic =
  | Param_GetSet<string, any>
  | Param_GetSet<string[], any>
// TODO: these are possible values for optional params
// | null | undefined

/**
 * Type safe helper to define a param parser.
 *
 * @param parser - the parser to define. Will be returned as is.
 */
/*! #__NO_SIDE_EFFECTS__ */
export function defineParamParser<TOut, TIn extends string | string[]>(parser: {
  get?: (value: TIn) => TOut
  set?: (value: TOut) => TIn
}): Param_GetSet<TIn, TOut> {
  return parser
}

const PATH_PARAM_DEFAULT_GET = (value: string | string[]) => value
const PATH_PARAM_DEFAULT_SET = (value: unknown) =>
  value && Array.isArray(value) ? value.map(String) : String(value)
// TODO: `(value an null | undefined)` for types

/**
 * NOTE: I tried to make this generic and infer the types from the params but failed. This is what I tried:
 * ```ts
 * export type ParamsFromParsers<P extends Record<string, ParamParser_Generic>> = {
 *   [K in keyof P]: P[K] extends Param_GetSet<infer TIn, infer TOut>
 *     ? unknown extends TOut // if any or unknown, use the value of TIn, which defaults to string | string[]
 *       ? TIn
 *       : TOut
 *     : never
 * }
 *
 * export class MatcherPatternPathDynamic<
 *   ParamsParser extends Record<string, ParamParser_Generic>
 * > implements MatcherPatternPath<ParamsFromParsers<ParamsParser>>
 * {
 *   private params: Record<string, Required<ParamParser_Generic>> = {}
 *   constructor(
 *     private re: RegExp,
 *     params: ParamsParser,
 *     public build: (params: ParamsFromParsers<ParamsParser>) => string
 *     ) {}
 * ```
 * It ended up not working in one place or another. It could probably be fixed by
 */

export type ParamsFromParsers<P extends Record<string, ParamParser_Generic>> = {
  [K in keyof P]: P[K] extends Param_GetSet<infer TIn, infer TOut>
    ? unknown extends TOut // if any or unknown, use the value of TIn, which defaults to string | string[]
      ? TIn
      : TOut
    : never
}

/**
 * Matcher for dynamic paths, e.g. `/team/:id/:name`.
 * Supports one, one or zero, one or more and zero or more params.
 */
export class MatcherPatternPathDynamic<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
> implements MatcherPatternPath<TParams>
{
  private params: Record<string, Required<ParamParser_Generic>> = {}

  constructor(
    private re: RegExp,
    params: Record<keyof TParams, ParamParser_Generic>,
    public build: (params: TParams) => string,
    private opts: { repeat?: boolean; optional?: boolean } = {}
  ) {
    for (const paramName in params) {
      const param = params[paramName]
      this.params[paramName] = {
        get: param.get || PATH_PARAM_DEFAULT_GET,
        // @ts-expect-error FIXME: should work
        set: param.set || PATH_PARAM_DEFAULT_SET,
      }
    }
  }

  /**
   * Match path against the pattern and return
   *
   * @param path - path to match
   * @throws if the patch doesn't match
   * @returns matched decoded params
   */
  match(path: string): TParams {
    const match = path.match(this.re)
    if (!match) {
      throw miss()
    }
    let i = 1 // index in match array
    const params = {} as TParams
    for (const paramName in this.params) {
      const currentParam = this.params[paramName]
      const currentMatch = match[i++]
      let value: string | null | string[] =
        this.opts.optional && currentMatch == null ? null : currentMatch
      value = this.opts.repeat && value ? value.split('/') : value

      params[paramName as keyof typeof params] = currentParam.get(
        // @ts-expect-error: FIXME: the type of currentParam['get'] is wrong
        value && (Array.isArray(value) ? value.map(decode) : decode(value))
      ) as (typeof params)[keyof typeof params]
    }

    if (__DEV__ && i !== match.length) {
      console.warn(
        `Regexp matched ${match.length} params, but ${i} params are defined. Found when matching "${path}" against ${String(this.re)}`
      )
    }
    return params
  }

  // build(params: TParams): string {
  //   let path = this.re.source
  //   for (const param of this.params) {
  //     const value = params[param.name as keyof TParams]
  //     if (value == null) {
  //       throw new Error(`Matcher build: missing param ${param.name}`)
  //     }
  //     path = path.replace(
  //       /([^\\]|^)\([^?]*\)/,
  //       `$1${encodeParam(param.set(value))}`
  //     )
  //   }
  //   return path
  // }
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
