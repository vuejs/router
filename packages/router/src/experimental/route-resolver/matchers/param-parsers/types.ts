import { MatcherQueryParamsValue } from '../matcher-pattern'

/**
 * Defines a parser that can read a param from the url (string-based) and
 * transform it into a more complex type, or vice versa.
 *
 * @see MatcherPattern
 */
export interface ParamParser<
  // type of the param after parsing as exposed in `route.params`
  TParam = MatcherQueryParamsValue,
  // this is the most permissive type that can be passed to get and set, it's from the query
  // path params stricter as they do not allow `null` within an array or `undefined`
  TUrlParam = MatcherQueryParamsValue,
  // the type that can be passed as a location when navigating: `router.push({ params: { }})`
  // it's sometimes for more permissive than TParam, for example allowing nullish values
  TParamRaw = TParam,
> {
  get?: (value: NoInfer<TUrlParam>) => TParam
  set?: (value: TParamRaw) => TUrlParam
}

/**
 * Defines a path param parser.
 *
 * @param parser - the parser to define. Will be returned as is.
 *
 * @see {@link defineQueryParamParser}
 * @see {@link defineParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */
export function definePathParamParser<
  TParam,
  // path params are parsed by the router as these
  // we use extend to allow infering a more specific type
  TUrlParam extends string | string[] | null,
  // we can allow pushing with extra values
  TParamRaw,
>(parser: Required<ParamParser<TParam, TUrlParam, TParamRaw>>) {
  return parser
}

/**
 * Defines a query param parser. Note that query params can also be used as
 * path param parsers.
 *
 * @param parser - the parser to define. Will be returned as is.
 *
 * @see {@link definePathParamParser}
 * @see {@link defineParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */
export function defineQueryParamParser<
  TParam,
  // we can allow pushing with extra values
  TParamRaw = TParam,
>(parser: Required<ParamParser<TParam, MatcherQueryParamsValue, TParamRaw>>) {
  return parser
}

/**
 * Alias for {@link defineQueryParamParser}. Implementing a param parser like this
 * works for path, query, and hash params.
 *
 * @see {@link defineQueryParamParser}
 * @see {@link definePathParamParser}
 */
/*! #__NO_SIDE_EFFECTS__ */
export const defineParamParser = defineQueryParamParser

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
