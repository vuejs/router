import { MatcherName, MatcherQueryParams } from './matcher'
import { EmptyParams, MatcherParamsFormatted } from './matcher-location'
import { miss } from './matchers/errors'

export interface MatcherPattern {
  /**
   * Name of the matcher. Unique across all matchers.
   */
  name: MatcherName

  path: MatcherPatternPath
  query?: MatcherPatternQuery
  hash?: MatcherPatternHash

  parent?: MatcherPattern
}

export interface MatcherPatternParams_Base<
  TIn = string,
  TOut extends MatcherParamsFormatted = MatcherParamsFormatted
> {
  match(value: TIn): TOut
  build(params: TOut): TIn
}

export interface MatcherPatternPath<
  TParams extends MatcherParamsFormatted = // | undefined // | void // so it might be a bit more convenient // TODO: should we allow to not return anything? It's valid to spread null and undefined
  // | null
  MatcherParamsFormatted
> extends MatcherPatternParams_Base<string, TParams> {}

export class MatcherPatternPathStatic
  implements MatcherPatternPath<EmptyParams>
{
  constructor(private path: string) {}

  match(path: string): EmptyParams {
    if (path !== this.path) {
      throw miss()
    }
    return {}
  }

  build(): string {
    return this.path
  }
}
// example of a static matcher built at runtime
// new MatcherPatternPathStatic('/')

export interface MatcherPatternQuery<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<MatcherQueryParams, TParams> {}

export interface MatcherPatternHash<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted
> extends MatcherPatternParams_Base<string, TParams> {}
