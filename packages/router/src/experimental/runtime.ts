// TODO: this file should be splitted into different features  since it's not about runtime anymore
import type { TypesConfig } from '../config'
import type { RouteRecordRaw } from '../types'

/**
 * Helper to define page properties with file-based routing.
 * **Doesn't do anything**, used for types only.
 *
 * The `FilePath` type parameter is injected by the `sfc-typed-router` Volar
 * plugin so that `params.path` keys are restricted to the file's actual path
 * params. When omitted, `params.path` falls back to a loose record.
 *
 * @param route - route information to be added to this page
 *
 * @internal
 */
export function definePage<FilePath extends string = string>(
  route: DefinePage<FilePath>
): DefinePage<FilePath> {
  return route
}

/**
 * Resolves the union of valid path-param names for a given file path. Falls
 * back to `string` when no entry is augmented (default Volar-less usage).
 *
 * Wired via the `_RouteFileInfoMap` slot in the user's augmented
 * {@link TypesConfig} so the lookup survives the bundler that otherwise
 * inlines an empty version of the base interface.
 *
 * @internal
 */
export type PathParamNamesForFilePath<FilePath extends string> =
  TypesConfig extends {
    _RouteFileInfoMap: {
      [K in FilePath]: { pathParamNames: infer N extends string }
    }
  }
    ? N
    : string

/**
 * Merges route records.
 *
 * @internal
 *
 * @param main - main route record
 * @param routeRecords - route records to merge
 * @returns merged route record
 */
export function _mergeRouteRecord(
  main: RouteRecordRaw,
  ...routeRecords: Partial<RouteRecordRaw>[]
): RouteRecordRaw {
  // @ts-expect-error: complicated types
  return routeRecords.reduce((acc, routeRecord) => {
    const meta = Object.assign({}, acc.meta, routeRecord.meta)
    const alias: string[] = ([] as string[]).concat(
      acc.alias || [],
      routeRecord.alias || []
    )

    // TODO: other nested properties
    // const props = Object.assign({}, acc.props, routeRecord.props)

    Object.assign(acc, routeRecord)
    acc.meta = meta
    acc.alias = alias
    return acc
  }, main)
}

/**
 * Type to define a page. Can be augmented to add custom properties.
 *
 * @typeParam FilePath - File path of the SFC declaring this page, used to
 * narrow `params.path` keys to the actual path parameters of the route. When
 * left as the default `string`, keys are unrestricted.
 */
export interface DefinePage<FilePath extends string = string> extends Partial<
  Omit<RouteRecordRaw, 'children' | 'components' | 'component' | 'name'>
> {
  /**
   * A route name. If not provided, the name will be generated based on the file path.
   * Can be set to `false` to remove the name from types.
   */
  name?: string | false

  /**
   * Custom parameters for the route. Requires `experimental.paramParsers` enabled.
   *
   * @experimental
   */
  params?: {
    /**
     * Parameters extracted from the path. Allows to setup custom parsers without changing the filename.
     */
    path?: { [K in PathParamNamesForFilePath<FilePath>]?: ParamParserType }

    /**
     * Parameters extracted from the query.
     */
    query?: Record<string, DefinePageQueryParamOptionsAny | ParamParserType>
  }
}

/**
 * Built-in param parsers. Always available; merged into {@link ParamParsers}
 * alongside any entries the user augments into {@link TypesConfig.ParamParsers}.
 *
 * @internal
 */
export interface ParamParsers_Native {
  int: { type: number }
  bool: { type: boolean }
}

export type ParamParserType_Native = keyof ParamParsers_Native

/**
 * Full registry of param parsers: built-ins merged with whatever the user
 * augments into {@link TypesConfig.ParamParsers}. Each entry is shaped
 * `{ type: T }` so the parsed value type can be looked up by name via
 * {@link ParamParserTypeOf}. The vue-router codegen emits this augmentation
 * automatically from files in the `params/` folder.
 *
 * @internal
 */
export type ParamParsers = ParamParsers_Native &
  (TypesConfig extends { _ParamParsers: infer P } ? P : {})

/**
 * Union of all known parser names (built-in + augmented).
 */
export type ParamParserType = keyof ParamParsers

/**
 * Resolves the parsed value type for a given parser name. Distributes over a
 * union of names, so `ParamParserTypeOf<'int' | 'date'>` → `number | Date`.
 *
 * Falls back to `unknown` when an entry is registered without a `type` field.
 * The `_ParamParsers` slot is internal — vue-router's codegen populates it
 * from files in `params/`.
 *
 * @example
 * ```ts
 * declare module 'vue-router' {
 *   interface TypesConfig {
 *     _ParamParsers: {
 *       date: { type: Date }
 *     }
 *   }
 * }
 * ```
 */
export type ParamParserTypeOf<Name extends ParamParserType> =
  Name extends keyof ParamParsers
    ? ParamParsers[Name] extends { type: infer T }
      ? T
      : unknown
    : unknown

/**
 * Distributive variant of {@link DefinePageQueryParamOptions} used in the
 * `params.query` record. Distributing over `ParamParserType` produces one
 * variant per literal parser name so the `parser` field acts as a discriminant
 * and `default` is narrowed to that parser's resolved value type. Without
 * this, the bare interface defaults `Parser` to the full `ParamParserType`
 * union and `default` collapses to the union of every parser's value type.
 *
 * @internal
 */
export type DefinePageQueryParamOptionsAny<
  P extends ParamParserType = ParamParserType,
> = P extends ParamParserType ? DefinePageQueryParamOptions<P> : never

/**
 * Configures how to extract a route param from a specific query parameter.
 *
 * @typeParam Parser - name of the param parser used for this query parameter,
 * used to type the {@link DefinePageQueryParamOptions.default | `default`}
 * value via {@link ParamParserTypeOf}.
 */
export interface DefinePageQueryParamOptions<
  Parser extends ParamParserType = ParamParserType,
> {
  /**
   * The type of the query parameter. Allowed values are native param parsers
   * and any parser in the {@link https://uvr.esm.is/TODO | params folder }. If
   * not provided, the value will kept as is.
   */
  parser?: Parser

  // TODO: allow customizing the name in the query string
  // queryKey?: string

  /**
   * Default value if the query parameter is missing or if the match fails
   * (e.g. a invalid number is passed to the int param parser). If not provided
   * and the param is not required, the route will match with undefined.
   */
  default?: (() => ParamParserTypeOf<Parser>) | ParamParserTypeOf<Parser>

  /**
   * How to format the query parameter value.
   *
   * - 'value' - keep the first value only and pass that to parser
   * - 'array' - keep all values (even one or none) as an array and pass that to parser
   *
   * @default 'value'
   */
  format?: 'value' | 'array'

  /**
   * Whether this query parameter is required. If true and the parameter is
   * missing (and no default is provided), the route will not match.
   *
   * @default false
   */
  required?: boolean
}

/**
 * TODO: native parsers ideas:
 * - json -> just JSON.parse(value)
 * - boolean -> 'true' | 'false' -> boolean
 * - number -> Number(value) -> NaN if not a number
 */
