import type { ParamParser } from './types'

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
}): ParamParser<TOut, TIn> {
  return parser
}
export const PATH_PARAM_DEFAULT_GET = (
  value: string | string[] | null | undefined
) => value ?? null
export const PATH_PARAM_SINGLE_DEFAULT: ParamParser<string, string> = {}
export const PATH_PARAM_DEFAULT_SET = (
  value: string | string[] | null | undefined
) => (value && Array.isArray(value) ? value.map(String) : String(value)) // TODO: `(value an null | undefined)` for types

export const PATH_PARAM_DEFAULT_PARSER: ParamParser = {
  get: PATH_PARAM_DEFAULT_GET,
  set: PATH_PARAM_DEFAULT_SET,
}

export { ParamParser }

export { PARAM_PARSER_INT } from './numbers'
