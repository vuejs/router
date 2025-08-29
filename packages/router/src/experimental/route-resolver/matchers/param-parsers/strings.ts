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
 * Native Param parser for strings.
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
