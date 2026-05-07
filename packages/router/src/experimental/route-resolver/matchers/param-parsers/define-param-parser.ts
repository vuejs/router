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
 * Defines a param parser that works with any kind of param (path, repeatable,
 * optional, query, hash, ...) but requires the user to handle all cases in the
 * get and set functions (nullish, undefined, arrays, etc). This allows you to
 * have full control over the parsing logic, but it also means that you need to
 * handle all edge cases yourself. If possible, prefer using {@see defineParamParser}
 * which provides a more structured way to handle these
 * cases and automatically handles arrays and nullish values.
 *
 * @example
 *
 * Here is an example that allows arbitrary numbers (NaN values are filtered
 * out). It supports repeatable params, so it can be used both as a path param
 * parser and a query param parser.
 *
 * ```ts
 * export const parser = defineParamParserRaw<number>({
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
 * @see {@link defineParamParser}
 */
export function defineParamParserRaw<
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

/**
 * Defines a param parser that transforms strings to another type. Handles
 * optional and repeatable params, so it can be used for both path and query
 * params.
 *
 * @example
 *
 * Here is an example that allows arbitrary numbers (NaN values are filtered
 * out). It supports repeatable params, so it can be used both as a path param
 * parser and a query param parser.
 *
 * ```ts
 * import { miss } from 'vue-router/experimental'
 *
 * export const parser = defineParamParser<number>({
 *   get: value => {
 *     const num = Number(value)
 *     if (Number.isNaN(num)) {
 *       miss(`"${value}" is not a valid number`)
 *     }
 *     return num
 *   },
 *
 *   set: value => String(value),
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
      // TODO: I think it would make more sense to not allow null
      // so users can focus on parsing strings
      TParam,
      string,
      TParamRaw
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
      value == null
        ? null // transforms undefined to null
        : Array.isArray(value)
          ? value.filter(v => v != null).map(parser.get)
          : parser.get(value),
    set: value =>
      value == null
        ? (value as null | undefined) // preserves null or undefined
        : Array.isArray(value)
          ? value.map(parser.set)
          : parser.set(value),
  }
}
