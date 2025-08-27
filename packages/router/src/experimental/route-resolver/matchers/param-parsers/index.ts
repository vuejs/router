import type { ParamParser } from './types'

export {
  definePathParamParser,
  defineParamParser,
  defineQueryParamParser,
} from './types'

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

export { PARAM_PARSER_INT } from './integers'
export { PARAM_PARSER_BOOL } from './booleans'
