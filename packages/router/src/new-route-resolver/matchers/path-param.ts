import type { MatcherPathParams } from '../matcher'
import { MatcherParamsFormatted } from '../matcher-location'
import type {
  MatcherPatternPath,
  PatternPathParamOptions,
} from '../matcher-pattern'

export class PatterParamPath<T> implements MatcherPatternPath {
  options: Required<Omit<PatternPathParamOptions<T>, 'default'>> & {
    default: undefined | (() => T) | T
  }

  constructor(options: PatternPathParamOptions<T>) {
    this.options = {
      set: String,
      default: undefined,
      ...options,
    }
  }

  match(path: string): MatcherPathParams {
    const match = this.options.re.exec(path)?.groups ?? {}
    if (!match) {
      throw new Error(
        `Path "${path}" does not match the pattern "${String(
          this.options.re
        )}"}`
      )
    }
    const params: MatcherPathParams = {}
    for (let i = 0; i < this.options.keys.length; i++) {
      params[this.options.keys[i]] = match[i + 1] ?? null
    }
    return params
  }

  buildPath(path: MatcherPathParams): string {
    throw new Error('Method not implemented.')
  }

  parse(params: MatcherPathParams): MatcherParamsFormatted {
    throw new Error('Method not implemented.')
  }

  serialize(params: MatcherParamsFormatted): MatcherPathParams {
    throw new Error('Method not implemented.')
  }
}
