/**
 * Defines a parser that can read a param from the url (string-based) and
 * transform it into a more complex type, or vice versa.
 *
 * @see MatcherPattern
 */
export interface ParamParser<
  TOut = string | string[] | null,
  TIn extends string | string[] | null = string | string[] | null,
> {
  get?: (value: NoInfer<TIn>) => TOut
  set?: (value: NoInfer<TOut>) => TIn
}

/**
 * Generic type for a param parser that can handle both single and repeatable params.
 *
 * @see ParamParser
 */
export type ParamParser_Generic =
  | ParamParser<any, string>
  | ParamParser<any, string[]>
