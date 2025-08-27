import { miss } from '../errors'
import { ParamParser } from './types'

const PARAM_INTEGER_SINGLE = {
  get: (value: string | null) => {
    const num = Number(value)
    if (value && Number.isInteger(num)) {
      return num
    }
    throw miss()
  },
  set: (value: number) => String(value),
} satisfies ParamParser<number, string | null>

const PARAM_INTEGER_REPEATABLE = {
  get: (value: (string | null)[]) =>
    value.filter((v): v is string => v != null).map(PARAM_INTEGER_SINGLE.get),
  set: (value: number[]) => value.map(PARAM_INTEGER_SINGLE.set),
} satisfies ParamParser<number[], (string | null)[]>

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
