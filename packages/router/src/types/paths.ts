import { RouteParams, RouteParamsRaw, RouteParamValueRaw } from '.'

/**
 * Extract an object of params given a path like `/users/:id`.
 *
 * @example
 * ```ts
 * type P = ParamsFromPath<'/:id/b/:c*'> // { id: string; c?: string[] }
 * ```
 */
export type ParamsFromPath<P extends string = string> =
  P extends `${string}:${string}`
    ? Simplify<_ExtractParamsOfPath<P, false>>
    : Record<any, never>

export type ParamsRawFromPath<P extends string = string> =
  P extends `${string}:${string}`
    ? Simplify<_ExtractParamsOfPath<P, true>>
    : Record<any, never>

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
export type _ParamDelimiter =
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
  | '$'
  | _ParamModifier

/**
 * Given a simple path, creates an object of the possible param values.
 *
 * @internal
 */
export type _ExtractParamsPath<
  P extends string,
  isRaw extends boolean
> = P extends `${string}{${infer PP}}${infer Rest}`
  ? (PP extends `${infer N}${_ParamModifier}`
      ? PP extends `${N}${infer M}`
        ? M extends _ParamModifier
          ? _ParamToObject<N, M, isRaw>
          : never
        : never
      : _ParamToObject<PP, '', isRaw>) &
      _ExtractParamsPath<Rest, isRaw>
  : {}

type _PathParam<P extends string, Rest extends string = ''> =
  | `${string}:${P}`
  | `${string}:${P}${_ParamModifier}${Rest}`

type b = '/' extends _PathParam<infer P> ? P : never
type c = '/home' extends _PathParam<infer P> ? P : never
type d = '/user/:id' extends _PathParam<infer P, infer Rest> ? [P, Rest] : never
type e = '/user/:id+' extends _PathParam<infer P> ? P : never

export type _ExtractParamsOfPath<
  P extends string,
  isRaw extends boolean
> = P extends `${string}:${infer HasParam}`
  ? _ParamName<HasParam> extends _ParamExtractResult<
      infer ParamName,
      infer Rest
    >
    ? // ParamName is delimited by something eg: /:id/b/:c
      // let's first remove the regex if there is one then extract the modifier
      _ExtractModifier<_StripRegex<Rest>> extends _ModifierExtracTResult<
        infer Modifier,
        infer Rest2
      >
      ? _ParamToObject<ParamName, Modifier, isRaw> &
          _ExtractParamsOfPath<Rest2, isRaw>
      : {
          NO: 1 // this should never happen as the modifier can be empty
        }
    : // Nothing after the param: /:id, we are done
      _ParamToObject<HasParam, '', isRaw>
  : {
      // EMPTY: 1
    }

type a1 = _ExtractParamsOfPath<'/', false>
type a2 = _ExtractParamsOfPath<'/:id', false>
type a3 = _ExtractParamsOfPath<'/:id/:b', false>
type a4 = _ExtractParamsOfPath<'/:id(.*)', false>
type a5 = _ExtractParamsOfPath<'/:id(.*)/other', false>
type a6 = _ExtractParamsOfPath<'/:id(.*)+', false>
type a7 = _ExtractParamsOfPath<'/:id(.*)+/other', false>
type a8 = _ExtractParamsOfPath<'/:id(.*)+/other/:b/:c/:d', false>

// TODO: perf test this to see if worth because it's way more readable
// also move to utils
export type Simplify<T> = { [K in keyof T]: T[K] }

type test1 =
  '/:id/:b' extends `${string}:${infer P}${_ParamDelimiter}${infer Rest}`
    ? [P, Rest]
    : never

type _ParamName_OLD<P extends string> =
  P extends `${_AlphaNumeric}${infer Rest}`
    ? P extends `${infer C}${Rest}`
      ? // Keep extracting other alphanumeric chars
        `${C}${_ParamName_OLD<Rest>}`
      : never // ERR
    : // add the rest to the end after a % which is invalid in a path so it can be used as a delimiter
      ` % ${P}`

interface _ParamExtractResult<P extends string, Rest extends string> {
  param: P
  rest: Rest
}

type _ParamName<
  Tail extends string,
  Head extends string = ''
> = Tail extends `${_AlphaNumeric}${infer Rest}`
  ? Tail extends `${infer C}${Rest}`
    ? // Keep extracting other alphanumeric chars
      _ParamName<Rest, `${Head}${C}`>
    : never // ERR
  : // add the rest to the end after a % which is invalid in a path so it can be used as a delimiter
    _ParamExtractResult<Head, Tail>

type p1 = _ParamName<'id'>
type p2 = _ParamName<'abc+/dos'>
type p3 = _ParamName<'abc/:dos)'>

/**
 * We consider a what comes after a param, e.g. For `/:id(\\d+)+/edit`, it would be `(\\d+)+/edit`. This should output
 * everything after the regex while handling escaped `)`: `+/edit`.
 */
export type _StripRegex<S extends string> =
  // do we have an escaped closing parenthesis?
  S extends `${infer A}\\)${infer Rest}`
    ? // the actual regexp finished before, A has no escaped )
      A extends `${string})${infer Rest2}`
      ? // get the modifier if there is one
        `${Rest2}\\)${Rest}` // job done
      : _RemoveUntilClosingPar<Rest> // we keep removing
    : // simple case with no escaping
    S extends `${string})${infer Rest}`
    ? // extract the modifier if there is one
      Rest
    : // nothing to remove
      S

type r1 = _StripRegex<'(\\d+)+/edit/:other(.*)*'>
type r3 = _StripRegex<'(.*)*'>
type r4 = _StripRegex<'?/rest'>
type r5 = _StripRegex<'*'>
type r6 = _StripRegex<'-other-stuff'>
type r7 = _StripRegex<'/edit'>

export interface _ModifierExtracTResult<
  M extends _ParamModifier | '',
  Rest extends string
> {
  modifier: M
  rest: Rest
}

export type _ExtractModifier<P extends string> =
  P extends `${_ParamModifier}${infer Rest}`
    ? P extends `${infer M}${Rest}`
      ? M extends _ParamModifier
        ? _ModifierExtracTResult<M, Rest>
        : // impossible case
          never
      : // impossible case
        never
    : // No modifier present
      _ModifierExtracTResult<'', P>

type m1 = _ExtractModifier<''>
type m2 = _ExtractModifier<'-rest'>
type m3 = _ExtractModifier<'edit'>
type m4 = _ExtractModifier<'+'>
type m5 = _ExtractModifier<'+/edit'>

export type _StripModifierAndRegex_OLD<S extends string> =
  // do we have an escaped closing parenthesis?
  S extends `${infer A}\\)${infer Rest}`
    ? // the actual regexp finished before, A has no escaped )
      A extends `${string})${infer Rest2}`
      ? // get the modifier if there is one
        Rest2 extends `${_ParamModifier}${infer Rest3}`
        ? Rest2 extends `${infer M}${Rest3}`
          ? { mod: M; rest: `${Rest3}\\)${Rest}` }
          : never
        : // No modifier
          { mod: ''; rest: `${Rest2}\\)${Rest}` } // job done
      : _RemoveUntilClosingPar<Rest> // we keep removing
    : // simple case with no escaping
    S extends `${string})${infer Rest}`
    ? // extract the modifier if there is one
      Rest extends `${_ParamModifier}${infer Rest2}`
      ? Rest extends `${infer M}${Rest2}`
        ? { mod: M; rest: Rest2 }
        : never
      : // no modifier
        { mod: ''; rest: Rest }
    : // nothing to remove
      { mod: ''; rest: S }

/**
 * Gets the possible type of a param based on its modifier M.
 *
 * @internal
 */
export type _ModifierParamValue<
  M extends _ParamModifier | '' = _ParamModifier | '',
  isRaw extends boolean = false
> = '' extends M
  ? _ParamValue<isRaw>
  : '+' extends M
  ? _ParamValueOneOrMore<isRaw>
  : '*' extends M
  ? _ParamValueZeroOrMore<isRaw>
  : '?' extends M
  ? _ParamValueZeroOrOne<isRaw>
  : never

/**
 * Utility type for raw and non raw params like :id+
 *
 * @internal
 */
export type _ParamValueOneOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly [string | number, ...(string | number)[]]
  : readonly [string, ...string[]]

/**
 * Utility type for raw and non raw params like :id*
 *
 * @internal
 */
export type _ParamValueZeroOrMore<isRaw extends boolean> = true extends isRaw
  ? readonly (string | number)[] | undefined | null
  : readonly string[] | undefined | null

/**
 * Utility type for raw and non raw params like :id?
 *
 * @internal
 */
export type _ParamValueZeroOrOne<isRaw extends boolean> = true extends isRaw
  ? RouteParamValueRaw
  : string

/**
 * Utility type for raw and non raw params like :id
 *
 * @internal
 */
export type _ParamValue<isRaw extends boolean> = true extends isRaw
  ? string | number
  : string

/**
 * Given a param name N and its modifier M, creates a param object for the pair.
 *
 * @internal
 */
export type _ParamToObject<
  N extends string,
  M extends _ParamModifier | '',
  isRaw extends boolean
> = M extends '?' | '*'
  ? {
      [K in N]?: _ModifierParamValue<M, isRaw>
    }
  : {
      [K in N]: _ModifierParamValue<M, isRaw>
    }

/**
 * Takes the custom regex (and everything after) of a param and strips it off.
 *
 * @example
 * - `\\d+(?:inner-group\\)-end)/:rest-of-url` becomes `/:rest-of-url`
 *
 * @internal
 */
export type _RemoveUntilClosingPar<S extends string> =
  // do we have an escaped closing parenthesis?
  S extends `${infer A}\\)${infer Rest}`
    ? // the actual regexp finished before, A has no escaped )
      A extends `${string})${infer Rest2}`
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

type r = _RemoveUntilClosingPar<`aouest)/end`>
type r2 = _RemoveUntilClosingPar<`aouest`>

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
 * Join an array of param values for repeated params
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
  : never

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
 * Recursively builds a path from a param based path with curly braces (e.g. `\{id\}`).
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
 *
 * @example
 * ```ts
 * type url = PathFromParams<'/users/:id', { id: 'posva' }> -> '/users/posva'
 * ```
 */
export type PathFromParams<
  P extends string,
  PO extends ParamsFromPath<P> = ParamsFromPath<P>
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

/**
 * Joins a prefix and a path putting a `/` between them when necessary
 *
 * @internal
 */
export type _JoinPath<
  Prefix extends string,
  Path extends string
> = Path extends `/${string}`
  ? Path
  : '' extends Prefix
  ? never
  : `${Prefix}${Prefix extends `${string}/` ? '' : '/'}${Path}`

/**
 * @internal
 */
type _AlphaNumeric =
  | 'a'
  | 'A'
  | 'b'
  | 'B'
  | 'c'
  | 'C'
  | 'd'
  | 'D'
  | 'e'
  | 'E'
  | 'f'
  | 'F'
  | 'g'
  | 'G'
  | 'h'
  | 'H'
  | 'i'
  | 'I'
  | 'j'
  | 'J'
  | 'k'
  | 'K'
  | 'l'
  | 'L'
  | 'm'
  | 'M'
  | 'n'
  | 'N'
  | 'o'
  | 'O'
  | 'p'
  | 'P'
  | 'q'
  | 'Q'
  | 'r'
  | 'R'
  | 's'
  | 'S'
  | 't'
  | 'T'
  | 'u'
  | 'U'
  | 'v'
  | 'V'
  | 'w'
  | 'W'
  | 'x'
  | 'X'
  | 'y'
  | 'Y'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '_'
