import { toValue } from 'vue'
import { miss } from './errors'
import type { MatcherPatternHash } from './matcher-pattern'
import type { ParamParser } from './param-parsers'

type HashParamValue<T, D, R> =
  | Exclude<T, undefined>
  | (D extends undefined
      ? R extends true
        ? never
        : undefined
      : Exclude<D extends () => infer V ? V : D, Exclude<T, undefined>> &
          (T | null | undefined))

/**
 * Reads and writes one param using the hash content, without its leading `#`.
 */
export class MatcherPatternHashParam<
  T = string,
  ParamName extends string = string,
  D = undefined,
  R extends boolean = false,
> implements MatcherPatternHash<Record<ParamName, HashParamValue<T, D, R>>> {
  constructor(
    private paramName: ParamName,
    private parser: Pick<ParamParser<T, string>, 'get'> &
      Pick<ParamParser<T>, 'set'> = {},
    private defaultValue?: D & (T | null | (() => T | null)),
    private required?: R
  ) {}

  match(hash: string): Record<ParamName, HashParamValue<T, D, R>> {
    let value
    if (hash) {
      const content = hash.slice(1)
      try {
        value = this.parser.get ? this.parser.get(content) : content
      } catch (error) {
        if (this.required && this.defaultValue === undefined) throw error
      }
    }
    if (value === undefined) {
      value =
        this.defaultValue !== undefined
          ? toValue(this.defaultValue)
          : this.required
            ? miss()
            : undefined
    }
    return { [this.paramName]: value } as Record<
      ParamName,
      HashParamValue<T, D, R>
    >
  }

  build(params: {
    [K in ParamName]?: HashParamValue<T, D, R> | undefined
  }): string {
    const value = params[this.paramName]
    if (value == null) return ''
    const content = this.parser.set ? this.parser.set(value) : String(value)
    return content == null ? '' : '#' + content
  }
}
