import { toValue } from 'vue'
import {
  EmptyParams,
  MatcherParamsFormatted,
  MatcherPattern,
  MatcherQueryParams,
  MatcherQueryParamsValue,
} from './matcher-pattern'
import { ParamParser, PARAM_PARSER_DEFAULTS } from './param-parsers'
import { miss } from './errors'

/**
 * Handles the `query` part of a URL. It can transform a query object into an
 * object of params and vice versa.
 */

export interface MatcherPatternQuery<
  TParams extends MatcherParamsFormatted = MatcherParamsFormatted,
> extends MatcherPattern<MatcherQueryParams, TParams> {}

export class MatcherPatternQueryParam<T, ParamName extends string>
  implements MatcherPatternQuery<Record<ParamName, T>>
{
  constructor(
    private paramName: ParamName,
    private queryKey: string,
    private format: 'value' | 'array' | 'both',
    private parser: ParamParser<T> = {},
    private defaultValue?: (() => T) | T
  ) {}

  match(query: MatcherQueryParams): Record<ParamName, T> {
    const queryValue: MatcherQueryParamsValue | undefined = query[this.queryKey]

    // normalize the value coming from the query based on the expected format
    // value => keep the last value if multiple
    // array => null becomes [], single value becomes [value]
    let valueBeforeParse =
      this.format === 'value'
        ? Array.isArray(queryValue)
          ? queryValue.at(-1)
          : queryValue
        : // format === 'array'
          Array.isArray(queryValue)
          ? queryValue
          : queryValue == null
            ? []
            : [queryValue]

    let value: T | undefined

    // if we have an array, pass the whole array to the parser
    if (Array.isArray(valueBeforeParse)) {
      // for arrays, if original query param was missing and we have a default, use it
      if (queryValue === undefined && this.defaultValue !== undefined) {
        value = toValue(this.defaultValue)
      } else {
        try {
          value = (this.parser.get ?? PARAM_PARSER_DEFAULTS.get)(
            valueBeforeParse
          ) as T
        } catch (error) {
          // if there is a miss but we have a default, use it
          // otherwise rethrow the error
          if (this.defaultValue === undefined) {
            throw error
          }
          // ensure the default value is used
          value = undefined
        }
      }
    } else {
      try {
        value =
          // non existing query param should fall back to defaultValue
          valueBeforeParse === undefined
            ? valueBeforeParse
            : ((this.parser.get ?? PARAM_PARSER_DEFAULTS.get)(
                valueBeforeParse
              ) as T)
      } catch (error) {
        if (this.defaultValue === undefined) {
          throw error
        }
      }
    }

    // miss if there is no default and there was no value in the query
    // otherwise, use the default value. This allows parsers to return undefined
    // when they want to possibly fallback to the default value
    if (value === undefined) {
      if (this.defaultValue === undefined) {
        throw miss()
      }
      value = toValue(this.defaultValue)
    }

    return {
      [this.paramName]: value,
      // This is a TS limitation
    } as Record<ParamName, T>
  }

  build(params: Record<ParamName, T>): MatcherQueryParams {
    const paramValue = params[this.paramName]

    if (paramValue === undefined) {
      return {} as EmptyParams
    }

    return {
      [this.queryKey]: (this.parser.set ?? PARAM_PARSER_DEFAULTS.set)(
        paramValue as any
      ),
    }
  }
}
