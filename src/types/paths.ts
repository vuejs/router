/**
 * Generic possible params from a path (after parsing).
 */
export type PathParams = Record<
  string,
  string | readonly string[] | undefined | null
>

/**
 * Possible param modifiers.
 *
 * @internal
 */
export type _ParamModifier = '+' | '?' | '*'

/**
 * Characters that mark the end of a param. In reality, there is a lot more than
 * this as only alphanumerical + _ are accepted as params but that is impossible
 * to achieve with TS and in practice, This set should cover them all. TODO: Add
 * missing characters that do not need to be encoded.
 *
 * @internal
 */
type _ParamDelimiter =
  | '-'
  | '/'
  | '%'
  | ':'
  | '('
  | '\\'
  | ';'
  | ','
  | '&'
  | '!'
  | "'"
  | '='
  | '@'
  | '['
  | ']'
  | _ParamModifier

/**
 * Given a simple path, creates an object of the possible param values.
 *
 * @internal
 */
export type _ExtractParamsPath<P extends string> =
  P extends `${string}{${infer PP}}${infer Rest}`
    ? (PP extends `${infer N}${_ParamModifier}`
        ? PP extends `${N}${infer M}`
          ? M extends _ParamModifier
            ? _ParamToObject<N, M>
            : never
          : never
        : _ParamToObject<PP, ''>) &
        _ExtractParamsPath<Rest>
    : {}

/**
 * Extract an object of params given a path like `/users/:id`.
 */
export type ParamsFromPath<P extends string = string> = string extends P
  ? PathParams // Generic version
  : _ExtractParamsPath<_RemoveRegexpFromParam<P>>

/**
 * Gets the possible type of a param based on its modifier M.
 *
 * @internal
 */
export type _ModifierParamValue<
  M extends _ParamModifier | '' = _ParamModifier | ''
> = '' extends M
  ? string
  : '+' extends M
  ? readonly [string, ...string[]]
  : '*' extends M
  ? readonly string[] | undefined | null
  : '?' extends M
  ? string | undefined | null
  : never

/**
 * Given a param name N and its modifier M, creates a param object for the pair.
 *
 * @internal
 */
export type _ParamToObject<
  N extends string,
  M extends _ParamModifier | ''
> = M extends '?' | '*'
  ? {
      [K in N]?: _ModifierParamValue<M>
    }
  : {
      [K in N]: _ModifierParamValue<M>
    }

/**
 * Takes the custom regex (and everything after) of a param and strips it off.
 *
 * @example
 * - `\\d+(?:inner-group\\)-end)/:rest-of-url` -> `/:rest-of-url`
 *
 * @internal
 */
export type _RemoveUntilClosingPar<S extends string> =
  S extends `${infer A}\\)${infer Rest}`
    ? A extends `${string})${infer Rest2}` // the actual regexp finished before, AA has no escaped )
      ? Rest2 extends `${_ParamModifier}${infer Rest3}`
        ? Rest2 extends `${infer M}${Rest3}`
          ? `${M}}${Rest3}\\)${Rest}`
          : never
        : `}${Rest2}\\)${Rest}` // job done
      : _RemoveUntilClosingPar<Rest> // we keep removing
    : S extends `${string})${infer Rest}`
    ? Rest extends `${_ParamModifier}${infer Rest2}`
      ? Rest extends `${infer M}${Rest2}`
        ? `${M}}${Rest2}`
        : never
      : `}${Rest}`
    : never // nothing to remove, should not have been called, easier to spot bugs

/**
 * Reformats a path string `/:id(custom-regex)/:other+` by wrapping params with
 * `{}` and removing custom regexps to make them easier to parse.
 *
 * @internal
 */
export type _RemoveRegexpFromParam<S extends string> =
  S extends `${infer A}:${infer P}${_ParamDelimiter}${infer Rest}`
    ? P extends _ExtractFirstParamName<P>
      ? S extends `${A}:${P}${infer D}${Rest}`
        ? D extends _ParamModifier | ''
          ? `${A}{${P}${D}}${S extends `${A}:${P}${D}${infer Rest2}` // we need to infer again...
              ? _RemoveRegexpFromParam<Rest2>
              : never}`
          : D extends _ParamDelimiter
          ? '(' extends D
            ? `${A}{${P}${S extends `${A}:${P}(${infer Rest2}` // we need to infer again to include D
                ? _RemoveRegexpFromParam<_RemoveUntilClosingPar<Rest2>>
                : '}'}`
            : `${A}{${P}}${S extends `${A}:${P}${infer Rest2}` // we need to infer again to include D
                ? _RemoveRegexpFromParam<Rest2>
                : never}`
          : never
        : never
      : never
    : S extends `${infer A}:${infer P}`
    ? P extends _ExtractFirstParamName<P>
      ? `${A}{${P}}`
      : never
    : S

/**
 * Extract the first param name (after a `:`) and ignores the rest.
 *
 * @internal
 */
export type _ExtractFirstParamName<S extends string> =
  S extends `${infer P}${_ParamDelimiter}${string}`
    ? _ExtractFirstParamName<P>
    : S extends `${string}${_ParamDelimiter}${string}`
    ? never
    : S

/**
 * Join an array of param values
 *
 * @internal
 */
type _JoinParams<V extends null | undefined | readonly any[]> = V extends
  | null
  | undefined
  ? ''
  : V extends readonly [infer A, ...infer Rest]
  ? A extends string
    ? `${A}${Rest extends readonly [any, ...any[]]
        ? `/${_JoinParams<Rest>}`
        : ''}`
    : never
  : ''

/**
 * Transform a param value to a string.
 *
 * @internal
 */
export type _ParamToString<V> = V extends null | undefined | readonly string[]
  ? _JoinParams<V>
  : V extends null | undefined | readonly never[] | readonly []
  ? ''
  : V extends string
  ? V
  : `oops`

/**
 * Possible values for a Modifier.
 *
 * @internal
 */
type _PossibleModifierValue =
  | string
  | readonly string[]
  | null
  | undefined
  | readonly never[]

/**
 * Recursively builds a path from a {param} based path
 *
 * @internal
 */
export type _BuildPath<
  P extends string,
  PO extends ParamsFromPath
> = P extends `${infer A}{${infer PP}}${infer Rest}`
  ? PP extends `${infer N}${_ParamModifier}`
    ? PO extends Record<N, _PossibleModifierValue>
      ? PO[N] extends readonly [] | readonly never[] | null | undefined
        ? `${A}${Rest extends `/${infer Rest2}` ? _BuildPath<Rest2, PO> : ''}`
        : `${A}${_ParamToString<PO[N]>}${_BuildPath<Rest, PO>}`
      : `${A}${Rest extends `/${infer Rest2}` ? _BuildPath<Rest2, PO> : ''}`
    : `${A}${PO extends Record<PP, _PossibleModifierValue>
        ? _ParamToString<PO[PP]>
        : ''}${_BuildPath<Rest, PO>}`
  : P

/**
 * Builds a path string type from a path definition and an object of params.
 * @example
 * ```ts
 * type url = PathFromParams<'/users/:id', { id: 'posva' }> -> '/users/posva'
 * ```
 */
export type PathFromParams<
  P extends string,
  PO extends ParamsFromPath<P>
> = string extends P ? string : _BuildPath<_RemoveRegexpFromParam<P>, PO>

/**
 * A param in a url like `/users/:id`.
 */
export interface PathParserParamKey<
  N extends string = string,
  M extends _ParamModifier | '' = _ParamModifier | ''
> {
  name: N
  repeatable: M extends '+' | '*' ? true : false
  optional: M extends '?' | '*' ? true : false
}

/**
 * Extracts the params of a path.
 *
 * @internal
 */
export type _ExtractPathParamKeys<P extends string> =
  P extends `${string}{${infer PP}}${infer Rest}`
    ? [
        PP extends `${infer N}${_ParamModifier}`
          ? PP extends `${N}${infer M}`
            ? M extends _ParamModifier
              ? PathParserParamKey<N, M>
              : never
            : never
          : PathParserParamKey<PP, ''>,
        ..._ExtractPathParamKeys<Rest>
      ]
    : []

/**
 * Extract the param keys (name and modifiers) tuple of a path.
 */
export type ParamKeysFromPath<P extends string = string> = string extends P
  ? readonly PathParserParamKey[] // Generic version
  : _ExtractPathParamKeys<_RemoveRegexpFromParam<P>>
