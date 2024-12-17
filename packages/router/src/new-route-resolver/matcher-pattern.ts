import { decode, MatcherName, MatcherQueryParams } from './matcher'
import { EmptyParams, MatcherParamsFormatted } from './matcher-location'
import { miss } from './matchers/errors'

export interface MatcherPattern {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  parent?: MatcherPattern
}

export interface MatcherPatternParams_Base<
  TIn = string,
  TOut extends MatcherParamsFormatted = MatcherParamsFormatted
> {
  /**
   * Matches a serialized params value against the pattern.
   *
   * @param value - params value to parse
   * @throws {MatchMiss} if the value doesn't match
   * @returns parsed params
   */
  match(value: TIn): TOut

  /**
   * Build a serializable value from parsed params. Should apply encoding if the
   * returned value is a string (e.g path and hash should be encoded but query
   * shouldn't).
   *
   * @param value - params value to parse
   */
  build(params: TOut): TIn
}

export interface MatcherPatternPath<
  // TODO: should we allow to not return anything? It's valid to spread null and undefined
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted // | null // | undefined // | void // so it might be a bit more convenient
> extends MatcherPatternParams_Base<string, TParams> {}

export class MatcherPatternPathStatic
  implements MatcherPatternPath<EmptyParams>
{
  constructor(private path: string) {}

  match(path: string): EmptyParams {
    if (path !== this.path) {
      throw miss()
    }
    return {}
  }

  build(): string {
    return this.path
  }
}
// example of a static matcher built at runtime
// new MatcherPatternPathStatic('/')

export interface Param_GetSet<
  TIn extends string | string[] = string | string[],
  TOut = TIn
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

export class MatcherPatternPathDynamic<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
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
        `Regexp matched ${match.length} params, but ${i} params are defined`
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

export interface MatcherPatternQuery<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<MatcherQueryParams, TParams> {}

export interface MatcherPatternHash<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<string, TParams> {}
