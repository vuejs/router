import { ParamParser } from './types'

const PARAM_STRING_SINGLE = {
  get: (value: string | null | undefined): string => value ?? '',
  set: (value: string) => String(value),
} satisfies ParamParser<string, string | null | undefined>

const PARAM_STRING_REPEATABLE = {
  get: (value: (string | null)[]) =>
    value.filter((v): v is string => v != null),
  set: (value: string[]) => value.map(String),
} satisfies ParamParser<string[], (string | null)[]>

/**
 * Native Param parser for strings. This is a permissive parser that will
 * transform `null` and `undefined` values to empty strings in single mode, and
 * will filter out `null` values in arrays. It's meant to be used for query
 * params. It doesn't make much sense to use it for path params will be `null |
 * string | string[]` (all cases combined).
 *
 * @internal
 */
export const PARAM_PARSER_STRING = {
  get: value =>
    Array.isArray(value)
      ? PARAM_STRING_REPEATABLE.get(value)
      : PARAM_STRING_SINGLE.get(value),
  set: value =>
    Array.isArray(value)
      ? PARAM_STRING_REPEATABLE.set(value)
      : PARAM_STRING_SINGLE.set(value ?? ''),
} satisfies ParamParser<string | string[] | null>
