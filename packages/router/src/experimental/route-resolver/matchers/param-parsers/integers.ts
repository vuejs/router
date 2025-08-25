import { miss } from '../errors'
import { ParamParser } from './types'

export const PARAM_INTEGER_SINGLE = {
  get: (value: string | null) => {
    const num = Number(value)
    if (value && Number.isInteger(num)) {
      return num
    }
    throw miss()
  },
  set: (value: number) => String(value),
} satisfies ParamParser<number, string | null>

export const PARAM_INTEGER_OPTIONAL = {
  get: (value: string | null) =>
    value == null ? null : PARAM_INTEGER_SINGLE.get(value),
  set: (value: number | null) =>
    value != null ? PARAM_INTEGER_SINGLE.set(value) : null,
} satisfies ParamParser<number | null, string | null>

export const PARAM_INTEGER_REPEATABLE = {
  get: (value: (string | null)[]) => value.map(PARAM_INTEGER_SINGLE.get),
  set: (value: number[]) => value.map(PARAM_INTEGER_SINGLE.set),
} satisfies ParamParser<number[], (string | null)[]>

export const PARAM_INTEGER_REPEATABLE_OPTIONAL = {
  get: (value: string[] | null) =>
    value == null ? null : PARAM_INTEGER_REPEATABLE.get(value),
  set: (value: number[] | null) =>
    value != null ? PARAM_INTEGER_REPEATABLE.set(value) : null,
} satisfies ParamParser<number[] | null, string[] | null>

/**
 * Native Param parser for integers.
 *
 * @internal
 */
export const PARAM_PARSER_INT = {
  get: value =>
    Array.isArray(value)
      ? PARAM_INTEGER_REPEATABLE.get(value)
      : value != null
        ? PARAM_INTEGER_SINGLE.get(value)
        : null,
  set: value =>
    Array.isArray(value)
      ? PARAM_INTEGER_REPEATABLE.set(value)
      : value != null
        ? PARAM_INTEGER_SINGLE.set(value)
        : null,
} satisfies ParamParser<number | number[] | null>
