// TODO: this file should be splitted into different features  since it's not about runtime anymore
import type { TypesConfig } from '../config'
import type { RouteRecordRaw } from '../types'
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
  RouteMap,
} from '../typed-routes'
import type {
  EXPERIMENTAL_RouteRecordPropsOption,
  _ComponentProps,
} from './route-props'

/**
 * Helper to define page properties with file-based routing.
 * **Doesn't do anything**, used for types only.
 *
 * The `FilePath` and `Component` type parameters are injected by the
 * `sfc-typed-router` Volar plugin. `FilePath` restricts the `params.path`
 * keys to the path params of the file and types the route location of
 * `props`. `Component` is the type of the page component and type checks
 * `props` against its props. When omitted, both fall back to loose types.
 *
 * @param route - route information to be added to this page
 *
 * @internal
 */
export function definePage<
  FilePath extends string = string,
  Component = unknown,
>(route: DefinePage<FilePath, Component>): DefinePage<FilePath, Component> {
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
 * Resolves the union of route names that can render a page file: the route
 * of the file and all its children. Falls back to all the route names when
 * no entry is augmented.
 *
 * @internal
 */
export type RouteNamesForFilePath<FilePath extends string> =
  TypesConfig extends {
    _RouteFileInfoMap: {
      [K in FilePath]: { routes: infer N }
    }
  }
    ? Extract<N, keyof RouteMap>
    : keyof RouteMap

/**
 * Route location that renders a page file.
 *
 * @internal
 */
export type RouteLocationForFilePath<FilePath extends string> = [
  RouteNamesForFilePath<FilePath>,
] extends [never]
  ? RouteLocationNormalizedLoadedGeneric
  : RouteLocationNormalizedLoaded<RouteNamesForFilePath<FilePath>>

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
 * Merges the `definePage()` data of each view into a route record of the
 * experimental router. The `props` of a page only apply to its view. `name`,
 * `path`, `alias`, and `params` are ignored because they are extracted at
 * build time.
 *
 * @internal
 *
 * @param main - route record generated from the file structure
 * @param pages - `definePage()` data, indexed by view name
 * @returns the merged route record
 */
export function _mergeRouteRecordViews<TRecord extends object>(
  main: TRecord,
  pages: Record<string, DefinePage>
): TRecord {
  const record = main as { meta?: object; props?: Record<string, unknown> }
  for (const view in pages) {
    const {
      name: _name,
      path: _path,
      alias: _alias,
      params: _params,
      meta,
      props,
      ...rest
    } = pages[view]!
    Object.assign(record, rest)
    if (meta) record.meta = Object.assign({}, record.meta, meta)
    if (props !== undefined) {
      record.props = Object.assign({}, record.props, { [view]: props })
    }
  }
  return main
}

/**
 * Type to define a page. Can be augmented to add custom properties.
 *
 * @typeParam FilePath - File path of the SFC declaring this page, used to
 * narrow `params.path` keys to the actual path parameters of the route. When
 * left as the default `string`, keys are unrestricted.
 * @typeParam Component - Type of the page component, used to type check
 * `props`. When left as the default `unknown`, any props are accepted.
 */
export interface DefinePage<
  FilePath extends string = string,
  Component = unknown,
> extends Partial<
  Omit<
    RouteRecordRaw,
    'children' | 'components' | 'component' | 'name' | 'props'
  >
> {
  /**
   * Pass props to the page component. It only applies to the view of the
   * page component, e.g. `sidebar` for `index@sidebar.vue`.
   *
   * - `true`: pass `route.params` (including query and hash params) as props.
   * - `false`: pass no props.
   * - object: pass these static props.
   * - function: receives the route location and returns the props.
   *
   * With the `sfc-typed-router` Volar plugin, the props are type checked
   * against the params of the route and the props of the page component.
   */
  props?: EXPERIMENTAL_RouteRecordPropsOption<
    RouteLocationForFilePath<FilePath>,
    _ComponentProps<Component>
  >

  /**
   * Override the route name. If not provided, the name will be generated based
   * on the file path. Can be set to `false` to make the route _anonymous_
   * which removes it from types and make the route unmatchable.
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
    path?: {
      [K in PathParamNamesForFilePath<FilePath>]?:
        | ParamParserType
        | DefinePagePathParamOptions
    }

    /**
     * Parameters extracted from the query.
     */
    query?: Record<string, DefinePageQueryParamOptionsAny | ParamParserType>

    /**
     * One parameter extracted from the hash content, without the leading `#`.
     */
    hash?: Record<string, ParamParserType | DefinePageHashParamOptionsAny>
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
  string: { type: string }
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
 * Configures how to extract a route param from the path.
 */
export interface DefinePagePathParamOptions {
  /**
   * The param parser to use. Set to `null` to remove the parser set in the
   * file name.
   */
  parser?: ParamParserType | null

  /**
   * Custom regexp to match the param value. Must not contain capturing groups
   * (use `(?:...)` instead), anchors, or match an empty value. Flags are
   * ignored. Set to `null` to use the default regexp.
   *
   * @example
   * ```ts
   * definePage({ params: { path: { org: { re: /@\w+/ } } } })
   * ```
   */
  re?: RegExp | null
}

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
export type DefinePageQueryParamOptions<
  Parser extends ParamParserType = ParamParserType,
> = DefinePageParamRequiredOrDefault<ParamParserTypeOf<Parser>> & {
  /**
   * The type of the query parameter. Allowed values are native param parsers
   * and any parser in the {@link https://uvr.esm.is/TODO | params folder }. If
   * not provided, the value will kept as is.
   */
  parser?: Parser

  // TODO: allow customizing the name in the query string
  // queryKey?: string

  /**
   * How to format the query parameter value.
   *
   * - 'value' - keep the first value only and pass that to parser
   * - 'array' - keep all values (even one or none) as an array and pass that to parser
   *
   * @default 'value'
   */
  format?: 'value' | 'array'
}

/**
 * A param can be required or have a default value, but not both.
 */
export type DefinePageParamRequiredOrDefault<T> =
  | {
      /**
       * Whether this param is required. If true and the param is missing or
       * fails to parse, the route will not match.
       *
       * @default false
       */
      required: true
      default?: never
    }
  | {
      required?: false
      /**
       * Default value if the param is missing or if the match fails (e.g. an
       * invalid number is passed to the int param parser). If not provided,
       * the route will match with `undefined`.
       */
      default?: T | (() => T)
    }

/**
 * Configures one parameter extracted from the whole hash.
 * An absent hash skips the parser and becomes `undefined` or the default.
 * A bare `#` passes an empty string to the parser.
 * Omitting `parser` uses strings. Other parsers must be named explicitly.
 * Setters return the hash content without its leading `#`.
 * Required params reject errors and `undefined`. Defaults replace only these results.
 */
export type DefinePageHashParamOptions<
  Parser extends ParamParserType = 'string',
> = DefinePageParamRequiredOrDefault<ParamParserTypeOf<Parser> | null> &
  (Parser extends 'string' ? { parser?: Parser } : { parser: Parser })

/**
 * Distributive hash options with defaults typed by parser name.
 *
 * @internal
 */
export type DefinePageHashParamOptionsAny<
  P extends ParamParserType = ParamParserType,
> = P extends ParamParserType ? DefinePageHashParamOptions<P> : never

/**
 * TODO: native parsers ideas:
 * - json -> just JSON.parse(value)
 * - boolean -> 'true' | 'false' -> boolean
 * - number -> Number(value) -> NaN if not a number
 */
