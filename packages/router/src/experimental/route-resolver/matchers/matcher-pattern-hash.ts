import type { MatcherPatternHash } from './matcher-pattern'
import type { ParamParser } from './param-parsers'

/**
 * Reads and writes one param using the entire hash, including its leading `#`.
 */
export class MatcherPatternHashParam<
  T,
  ParamName extends string,
> implements MatcherPatternHash<Record<ParamName, T>> {
  constructor(
    private paramName: ParamName,
    private parser: ParamParser<T, string> = {}
  ) {}

  match(hash: string): Record<ParamName, T> {
    return {
      [this.paramName]: this.parser.get ? this.parser.get(hash) : hash,
    } as Record<ParamName, T>
  }

  build(params: Record<ParamName, T>): string {
    const value = params[this.paramName]
    return this.parser.set
      ? this.parser.set(value)
      : value == null
        ? ''
        : String(value)
  }
}
