import type { MatcherQueryParamsValue } from '../matcher-pattern'
import type { ParamParser } from './types'

export const PATH_PARAM_SINGLE_DEFAULT: ParamParser<string, string> = {}

/**
 * Default parser for params that will keep values as is, and will use `String()`
 */
export const PARAM_PARSER_DEFAULTS = {
  get: value => value ?? null,
  set: value =>
    value == null
      ? null
      : Array.isArray(value)
        ? value.map(v => (v == null ? null : String(v)))
        : String(value),
} satisfies ParamParser

export const PATH_PARAM_PARSER_DEFAULTS = {
  get: value => value ?? null,
  set: value =>
    value == null
      ? null
      : Array.isArray(value)
        ? value.map(String)
        : String(value),
  // differently from PARAM_PARSER_DEFAULTS, this doesn't allow null values in arrays
} satisfies ParamParser<string | string[] | null, string | string[] | null>

/**
 * Defines a path param parser.
 *
 * @param parser - the parser to define. Will be returned as is.
 *
 * @see {@link defineQueryParamParser}
 * @see {@link defineParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */
export function definePathParamParser<
  TParam,
  // path params are parsed by the router as these
  // we use extend to allow infering a more specific type
  TUrlParam extends string | string[] | null = string | string[] | null,
  // we can allow pushing with extra values
  TParamRaw = TParam,
>(parser: Required<ParamParser<TParam, TUrlParam, TParamRaw>>) {
  return parser
}

/**
 * Defines a query param parser. Note that query params can also be used as
 * path param parsers.
 *
 * @param parser - the parser to define. Will be returned as is.
 *
 * @see {@link definePathParamParser}
 * @see {@link defineParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */
export function defineQueryParamParser<
  TParam,
  // we can allow pushing with extra values
  TParamRaw = TParam,
>(parser: Required<ParamParser<TParam, MatcherQueryParamsValue, TParamRaw>>) {
  return parser
}

/**
 * Defines a param parser that works with any kind of param (path, repeatable, optional, query, hash, ...)
 *
 * @example
 *
 * Here is an example that allows arbitrary numbers (NaN values are filtered
 * out). It supports repeatable params, so it can be used both as a path param
 * parser and a query param parser.
 *
 * ```ts
 * export const parser = defineParamParser<number>({
 *   get: value => {
 *     if (value == null) return null
 *     if (Array.isArray(value)) {
 *       return value
 *         .filter(v => v != null)
 *         .map(Number)
 *         .filter(v => !Number.isNaN(v))
 *     }
 *
 *     return Number.isNaN(Number(value))
 *       ? miss(`"${value}" is not a valid number`)
 *       : Number(value)
 *   },
 *
 *   set: value =>
 *     Array.isArray(value)
 *       ? value.map(String)
 *       : value == null
 *         ? null
 *         : String(value),
 * })
 * ```
 *
 * @see {@link defineQueryParamParser}
 * @see {@link definePathParamParser}
 */
export function defineParamParser<
  TParam,
  // we can allow pushing with extra values
  TParamRaw = TParam,
>(
  parser: Required<
    ParamParser<
      TParam | TParam[] | null,
      MatcherQueryParamsValue,
      TParamRaw | TParamRaw[] | null
    >
  >
) {
  return parser
}

// FIXME: I think this one should be the defineParamParser. It's not released yet, so we can adapt it

export function defineParamParser2<
  TParam,
  // we can allow pushing with extra values
  TParamRaw = TParam,
>(
  parser: Required<
    ParamParser<
      // TODO: I think it would make more sense to not allow null
      // so users can focus on parsing strings
      TParam | null,
      string | null | undefined,
      TParamRaw | null | undefined
    >
  >
): Required<
  ParamParser<
    TParam | TParam[] | null,
    MatcherQueryParamsValue,
    TParamRaw | TParamRaw[] | null | undefined
  >
> {
  return {
    get: value =>
      Array.isArray(value)
        ? value.map(parser.get).filter(v => v != null)
        : parser.get(value),
    set: value =>
      value == null
        ? null // TODO: should probably be value to preserve undefined values
        : Array.isArray(value)
          ? value
              .map(parser.set)
              // needed if the setter can return undefined
              .filter(v => v != null)
          : parser.set(value),
  }
}
