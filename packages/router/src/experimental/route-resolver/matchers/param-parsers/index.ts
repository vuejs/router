import type { MatcherQueryParamsValue } from '../matcher-pattern'
import type { ParamParser } from './types'

export { PARAM_PARSER_BOOL } from './booleans'
export { PARAM_PARSER_INT } from './integers'

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

export type { ParamParser }

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
  TUrlParam extends string | string[] | null,
  // we can allow pushing with extra values
  TParamRaw,
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
 * Alias for {@link defineQueryParamParser}. Implementing a param parser like this
 * works for path, query, and hash params.
 *
 * @see {@link defineQueryParamParser}
 * @see {@link definePathParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */

export const defineParamParser = defineQueryParamParser
