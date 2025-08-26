import { toValue } from 'vue'
import {
  EmptyParams,
  MatcherParamsFormatted,
  MatcherPattern,
  MatcherQueryParams,
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
    const queryValue = query[this.queryKey]

    let valueBeforeParse =
      this.format === 'value'
        ? Array.isArray(queryValue)
          ? queryValue[0]
          : queryValue
        : this.format === 'array'
          ? Array.isArray(queryValue)
            ? queryValue
            : [queryValue]
          : queryValue

    let value: T | undefined

    // if we have an array, we need to try catch each value
    if (Array.isArray(valueBeforeParse)) {
      // @ts-expect-error: T is not connected to valueBeforeParse
      value = []
      for (const v of valueBeforeParse) {
        if (v != null) {
          try {
            ;(value as unknown[]).push(
              // for ts errors
              (this.parser.get ?? PARAM_PARSER_DEFAULTS.get)(v) as T
            )
          } catch (error) {
            // we skip the invalid value unless there is no defaultValue
            if (this.defaultValue === undefined) {
              throw error
            }
          }
        }
      }

      // if we have no values, we want to fall back to the default value
      if (
        this.defaultValue !== undefined &&
        (value as unknown[]).length === 0
      ) {
        value = undefined
      }
    } else {
      try {
        value =
          // non existing query param should falll back to defaultValue
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
