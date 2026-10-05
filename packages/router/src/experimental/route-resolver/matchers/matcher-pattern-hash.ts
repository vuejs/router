import { toValue } from 'vue'
import { miss } from './errors'
import type { MatcherPatternHash } from './matcher-pattern'
import type { ParamParser } from './param-parsers'

/**
 * Reads and writes one param using the entire hash, including its leading `#`.
 */
export class MatcherPatternHashParam<
  T = string,
  ParamName extends string = string,
> implements MatcherPatternHash<Record<ParamName, T | null>> {
  constructor(
    private paramName: ParamName,
    private parser: ParamParser<T, string> = {},
    private defaultValue?: (() => T) | T,
    private required?: boolean
  ) {}

  match(hash: string): Record<ParamName, T | null> {
    if (hash === '' && this.defaultValue !== undefined) {
      return { [this.paramName]: toValue(this.defaultValue) } as Record<
        ParamName,
        T | null
      >
    }
    let value: T | string | null = null
    try {
      value = this.parser.get ? (this.parser.get(hash) ?? null) : hash || null
    } catch (error) {
      if (this.required && this.defaultValue === undefined) throw error
    }
    if (value == null) {
      if (this.defaultValue !== undefined) {
        value = toValue(this.defaultValue)
      } else if (this.required) {
        miss()
      }
    }
    return { [this.paramName]: value } as Record<ParamName, T | null>
  }

  build(params: { [K in ParamName]?: T | null | undefined }): string {
    const value = params[this.paramName]
    return value == null
      ? ''
      : this.parser.set
        ? this.parser.set(value)
        : String(value)
  }
}
