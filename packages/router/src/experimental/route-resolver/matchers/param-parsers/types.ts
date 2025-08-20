import { MatcherQueryParamsValue } from '../matcher-pattern'

/**
 * Defines a parser that can read a param from the url (string-based) and
 * transform it into a more complex type, or vice versa.
 *
 * @see MatcherPattern
 */
export interface ParamParser<
  TOut = MatcherQueryParamsValue,
  TIn extends MatcherQueryParamsValue = MatcherQueryParamsValue,
> {
  get?: (value: NoInfer<TIn>) => TOut
  set?: (value: NoInfer<TOut>) => TIn
}

// TODO: I wonder if native param parsers should follow this or similar
// these parsers can be used for both query and path params
// export type ParamParserBoth<T> = ParamParser<T | T[] | null>

/**
 * Generic type for a param parser that can handle both single and repeatable params.
 *
 * @see ParamParser
 */
export type ParamParser_Generic =
  | ParamParser<any, string>
  | ParamParser<any, string[]>
