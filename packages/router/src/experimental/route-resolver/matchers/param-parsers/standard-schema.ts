import type { StandardSchemaV1 } from './standard-schema-types'
import { miss } from '../errors'
import type { ParamParser } from './types'
import { MatcherQueryParamsValue } from '../matcher-pattern'

/**
 * Normalizes a param parser input, converting a StandardSchema-compliant object
 * into a {@link ParamParser} if needed.
 *
 * @param parser - a param parser or a StandardSchema-compliant validator
 *
 * @internal
 */
export function normalizeParamParser<
  TParam = MatcherQueryParamsValue,
  TUrlParam = MatcherQueryParamsValue,
  TParamRaw = TParam,
>(
  parser:
    | ParamParser<TParam, TUrlParam, TParamRaw>
    | StandardSchemaV1<unknown, TParam>
): ParamParser<TParam, TUrlParam, TParamRaw> {
  return '~standard' in parser
    ? {
        get(value: TUrlParam): TParam {
          const result = parser['~standard'].validate(
            value
          ) as StandardSchemaV1.Result<TParam>
          if (__DEV__ && result instanceof Promise) {
            throw new TypeError(
              'async validation is not supported for param parsers'
            )
          }
          if (result.issues) {
            miss(result.issues.map(issue => issue.message).join(', '))
          }
          return result.value
        },
      }
    : parser
}

/**
 * Extracts the param type from Param Parsers or StandardSchema validators.
 *
 * @internal
 */
export type ExtractParamParserType<PP> =
  PP extends ParamParser<infer T, any, any>
    ? T
    : PP extends StandardSchemaV1<unknown, infer T>
      ? T
      : unknown
