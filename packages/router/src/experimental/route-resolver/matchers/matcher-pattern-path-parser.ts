import type {
  PathParams,
  PathParser,
  _PathParserOptions,
} from '../../../matcher/pathParserRanker'
import { tokensToParser } from '../../../matcher/pathParserRanker'
import { tokenizePath } from '../../../matcher/pathTokenizer'
import { decode, encodeParam } from '../../encoding'
import { miss } from './errors'
import type {
  MatcherParamsFormatted,
  MatcherPatternPath,
} from './matcher-pattern'

/**
 * Params extracted by {@link MatcherPatternPathParser}. Optional params are
 * `null` when absent and repeatable params are always arrays.
 */
export type MatcherPatternPathParser_Params = Record<
  string,
  string | string[] | null
>

/**
 * Handles the `path` part of a URL with the route syntax of the classic router
 * (e.g. `/users/:id(\\d+)`, `/:pathMatch(.*)*`). It also exposes a `score` used
 * to rank records.
 *
 * @example
 * ```ts
 * const matcher = new MatcherPatternPathParser('/users/:id')
 * matcher.match('/users/1') // { id: '1' }
 * matcher.build({ id: '1' }) // '/users/1'
 * ```
 */
export class MatcherPatternPathParser implements MatcherPatternPath<
  MatcherPatternPathParser_Params,
  MatcherParamsFormatted
> {
  /**
   * Parser created from the path.
   */
  readonly parser: PathParser

  /**
   * Score used to rank this pattern against other patterns.
   */
  readonly score: PathParser['score']

  /**
   * @param path - path with the classic route syntax
   * @param options - options to create the RegExp
   */
  constructor(
    readonly path: string,
    options?: _PathParserOptions
  ) {
    this.parser = tokensToParser(tokenizePath(path), options)
    this.score = this.parser.score
  }

  match(path: string): MatcherPatternPathParser_Params {
    const raw = this.parser.parse(path)
    if (!raw) miss()

    const params: MatcherPatternPathParser_Params = {}
    for (const { name, repeatable, optional } of this.parser.keys) {
      const value = raw[name]
      params[name] = repeatable
        ? value
          ? (value as string[]).map(decode)
          : []
        : optional && !value
          ? null
          : decode(value as string)
    }
    return params
  }

  build(params: MatcherParamsFormatted): string {
    const encoded: PathParams = {}
    for (const { name } of this.parser.keys) {
      const value = params[name] as
        | string
        | number
        | null
        | undefined
        | Array<string | number>
      if (value != null) {
        encoded[name] = Array.isArray(value)
          ? value.map(encodeParam)
          : encodeParam(value)
      }
    }
    return this.parser.stringify(encoded)
  }
}
