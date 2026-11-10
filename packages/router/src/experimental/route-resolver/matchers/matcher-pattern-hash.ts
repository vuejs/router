import { toValue } from 'vue'
import { decode, PERCENT_RE } from '../../encoding'
import type { MatcherPatternHash } from './matcher-pattern'
import type { ParamParser } from './param-parsers'

type HashParamValue<T, TDefault, TRequired> =
  | Exclude<T, undefined>
  | (TDefault extends undefined
      ? TRequired extends true
        ? never
        : undefined
      : Exclude<
          TDefault extends () => infer TValue ? TValue : TDefault,
          Exclude<T, undefined>
        > &
          (T | null | undefined))

/**
 * Reads and writes one param using the hash content, without its leading `#`.
 */
export class MatcherPatternHashParam<
  T = string,
  ParamName extends string = string,
  TDefault = undefined,
  TRequired extends boolean = false,
> implements MatcherPatternHash<
  Record<ParamName, HashParamValue<T, TDefault, TRequired>>
> {
  constructor(
    private paramName: ParamName,
    private parser: Pick<ParamParser<T, string>, 'get'> &
      Pick<ParamParser<T>, 'set'> = {},
    private defaultValue?: TDefault & (T | null | (() => T | null)),
    private required?: TRequired
  ) {}

  match(
    hash: string
  ): Record<ParamName, HashParamValue<T, TDefault, TRequired>> | null {
    let value
    if (hash) {
      const content = decode(hash.slice(1))
      try {
        value = this.parser.get ? this.parser.get(content) : content
      } catch (error) {
        if (this.required && this.defaultValue === undefined) throw error
      }
    }
    if (value === undefined) {
      if (this.defaultValue !== undefined) {
        value = toValue(this.defaultValue)
      } else if (this.required) {
        return null
      }
    }
    return { [this.paramName]: value } as Record<
      ParamName,
      HashParamValue<T, TDefault, TRequired>
    >
  }

  build(params: {
    [K in ParamName]?: HashParamValue<T, TDefault, TRequired> | undefined
  }): string {
    const value = params[this.paramName]
    if (value == null) return ''
    const content = this.parser.set ? this.parser.set(value) : String(value)
    return content == null
      ? ''
      : // the resolver protects the rest with encodeHash, which keeps %
        '#' + String(content).replace(PERCENT_RE, '%25')
  }
}
