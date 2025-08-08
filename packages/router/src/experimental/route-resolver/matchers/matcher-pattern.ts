import { encodeParam } from '../../../encoding'
import { warn } from '../../../warning'
import { decode, MatcherQueryParams } from '../resolver-abstract'
import { miss } from './errors'

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
  TIn extends string | string[] | null | undefined =
    | string
    | string[]
    | null
    | undefined,
  TOut = string | string[] | null,
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

interface IdFn {
  (v: undefined | null): null
  (v: string): string
  (v: string[]): string[]
}

const PATH_PARAM_DEFAULT_GET = (value => value ?? null) as IdFn
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

interface MatcherPatternPathCustomParamOptions<
  TIn extends string | string[] | null = string | string[] | null,
  TOut = string | string[] | null,
> {
  repeat?: boolean
  // TODO: not needed because in the regexp, the value is undefined if the group is optional and not given
  optional?: boolean
  parser?: Param_GetSet<TIn, TOut>
}

const IS_INTEGER_RE = /^-?[1-9]\d*$/

export const PARAM_INTEGER = {
  get: (value: string) => {
    if (IS_INTEGER_RE.test(value)) {
      const num = Number(value)
      if (Number.isFinite(num)) {
        return num
      }
    }
    throw miss()
  },
  set: (value: number) => String(value),
} satisfies Param_GetSet<string, number>

export const PARAM_NUMBER_OPTIONAL = {
  get: (value: string | null) =>
    value == null ? null : PARAM_INTEGER.get(value),
  set: (value: number | null) =>
    value != null ? PARAM_INTEGER.set(value) : null,
} satisfies Param_GetSet<string | null, number | null>

export const PARAM_NUMBER_REPEATABLE = {
  get: (value: string[]) => value.map(PARAM_INTEGER.get),
  set: (value: number[]) => value.map(PARAM_INTEGER.set),
} satisfies Param_GetSet<string[], number[]>

export const PARAM_NUMBER_REPEATABLE_OPTIONAL = {
  get: (value: string[] | null) =>
    value == null ? null : PARAM_NUMBER_REPEATABLE.get(value),
  set: (value: number[] | null) =>
    value != null ? PARAM_NUMBER_REPEATABLE.set(value) : null,
} satisfies Param_GetSet<string[] | null, number[] | null>

export class MatcherPatternPathCustomParams implements MatcherPatternPath {
  private paramsKeys: string[]

  constructor(
    readonly re: RegExp,
    readonly params: Record<
      string,
      MatcherPatternPathCustomParamOptions<unknown, unknown>
    >,
    // A better version could be using all the parts to join them
    // .e.g ['users', 0, 'profile', 1] -> /users/123/profile/456
    // numbers are indexes of the params in the params object keys
    readonly pathParts: Array<string | number>
  ) {
    this.paramsKeys = Object.keys(this.params)
  }

  match(path: string): MatcherParamsFormatted {
    const match = path.match(this.re)
    if (!match) {
      throw miss()
    }
    // NOTE: if we have params, we assume named groups
    const params = {} as MatcherParamsFormatted
    let i = 1 // index in match array
    for (const paramName in this.params) {
      const paramOptions = this.params[paramName]
      const currentMatch = (match[i] as string | undefined) ?? null

      const value = paramOptions.repeat
        ? (currentMatch?.split('/') || []).map(
            // using  just decode makes the type inference fail
            v => decode(v)
          )
        : decode(currentMatch)

      params[paramName] = (paramOptions.parser?.get || (v => v))(value)
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

  build(params: MatcherParamsFormatted): string {
    return this.pathParts.reduce((acc, part) => {
      if (typeof part === 'string') {
        return acc + '/' + part
      }
      const paramName = this.paramsKeys[part]
      const paramOptions = this.params[paramName]
      const value = (paramOptions.parser?.set || (v => v))(params[paramName])
      const encodedValue = Array.isArray(value)
        ? value.map(encodeParam).join('/')
        : encodeParam(value)
      return encodedValue ? acc + '/' + encodedValue : acc
    }, '')
  }
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
      warn(
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

/**
 * Generic object of params that can be passed to a matcher.
 */
export type MatcherParamsFormatted = Record<string, unknown>

/**
 * Empty object in TS.
 */
export type EmptyParams = Record<PropertyKey, never>
