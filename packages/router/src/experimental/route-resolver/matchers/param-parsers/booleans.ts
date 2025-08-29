import { miss } from '../errors'
import { ParamParser } from './types'

const PARAM_BOOLEAN_SINGLE = {
  get: (value: string | null | undefined) => {
    // we want to differentiate between the absence of a value
    if (value === undefined) return undefined

    if (value == null) return true

    const lowercaseValue = value.toLowerCase()

    if (lowercaseValue === 'true') {
      return true
    }

    if (lowercaseValue === 'false') {
      return false
    }

    throw miss()
  },
  set: (value: boolean | null | undefined) =>
    value == null ? value : String(value),
} satisfies ParamParser<boolean | null | undefined, string | null | undefined>

const PARAM_BOOLEAN_REPEATABLE = {
  get: (value: (string | null)[]) =>
    value.map(v => {
      const result = PARAM_BOOLEAN_SINGLE.get(v)
      // Filter out undefined values to ensure arrays only contain booleans
      return result === undefined ? false : result
    }),
  set: (value: boolean[]) =>
    // since v is always a boolean, set always returns a string
    value.map(v => PARAM_BOOLEAN_SINGLE.set(v) as string),
} satisfies ParamParser<boolean[], (string | null)[]>

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
} satisfies ParamParser<boolean | boolean[] | null | undefined>
