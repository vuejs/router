import type { MatcherQueryParamsValue } from '../matcher-pattern'

/**
 * Defines a parser that can read a param from the url (string-based) and
 * transform it into a more complex type, or vice versa.
 *
 * @see MatcherPattern
 */
export interface ParamParser<
  // type of the param after parsing as exposed in `route.params`
  TParam = MatcherQueryParamsValue,
  // this is the most permissive type that can be passed to get and returned by
  // set. By default it's the type of query path params (stricter as they do
  // not allow `null` within an array or `undefined`)
  TUrlParam = MatcherQueryParamsValue,
  // the type that can be passed as a location when navigating: `router.push({ params: { }})`
  // it's sometimes for more permissive than TParam, for example allowing nullish values
  TParamRaw = TParam,
> {
  get?: (value: NoInfer<TUrlParam>) => TParam
  set?: (value: TParamRaw) => TUrlParam
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
