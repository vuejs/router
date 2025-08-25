import { miss } from '../errors'
import { ParamParser } from './types'

export const PARAM_BOOLEAN_SINGLE = {
  get: (value: string | null) => {
    if (!value) return false

    const lowercaseValue = value.toLowerCase()

    if (lowercaseValue === 'true') {
      return true
    }

    if (lowercaseValue === 'false') {
      return false
    }

    throw miss()
  },
  set: (value: boolean | null) => String(!!value),
} satisfies ParamParser<boolean, string | null>

export const PARAM_BOOLEAN_OPTIONAL = {
  get: (value: string | null) =>
    value == null ? null : PARAM_BOOLEAN_SINGLE.get(value),
  set: (value: boolean | null) =>
    value != null ? PARAM_BOOLEAN_SINGLE.set(value) : null,
} satisfies ParamParser<boolean | null, string | null>

export const PARAM_BOOLEAN_REPEATABLE = {
  get: (value: (string | null)[]) => value.map(PARAM_BOOLEAN_SINGLE.get),
  set: (value: boolean[]) => value.map(PARAM_BOOLEAN_SINGLE.set),
} satisfies ParamParser<boolean[], (string | null)[]>

export const PARAM_BOOLEAN_REPEATABLE_OPTIONAL = {
  get: (value: string[] | null) =>
    value == null ? null : PARAM_BOOLEAN_REPEATABLE.get(value),
  set: (value: boolean[] | null) =>
    value != null ? PARAM_BOOLEAN_REPEATABLE.set(value) : null,
} satisfies ParamParser<boolean[] | null, string[] | null>

/**
 * Native Param parser for booleans.
 *
 * @internal
 */
export const PARAM_PARSER_BOOL = {
  get: value =>
    Array.isArray(value)
      ? PARAM_BOOLEAN_REPEATABLE.get(value)
      : PARAM_BOOLEAN_SINGLE.get(value),
  set: value =>
    Array.isArray(value)
      ? PARAM_BOOLEAN_REPEATABLE.set(value)
      : PARAM_BOOLEAN_SINGLE.set(value),
} satisfies ParamParser<boolean | boolean[] | null>
