// TODO: this file should be splitted into different features  since it's not about runtime anymore
import type { TypesConfig } from '../config'
import type { RouteRecordRaw } from '../types'

/**
 * Helper to define page properties with file-based routing.
 * **Doesn't do anything**, used for types only.
 *
 * @param route - route information to be added to this page
 *
 * @internal
 */
export const definePage = (route: DefinePage) => route

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
 */
export interface DefinePage extends Partial<
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
    path?: Record<string, ParamParserType>

    /**
     * Parameters extracted from the query.
     */
    query?: Record<string, DefinePageQueryParamOptions | ParamParserType>
  }
}

export type ParamParserType_Native = 'int' | 'bool'

export type ParamParserType =
  | (TypesConfig extends Record<'ParamParsers', infer ParamParsers>
      ? ParamParsers
      : never)
  | ParamParserType_Native

/**
 * Configures how to extract a route param from a specific query parameter.
 */
export interface DefinePageQueryParamOptions<T = unknown> {
  /**
   * The type of the query parameter. Allowed values are native param parsers
   * and any parser in the {@link https://uvr.esm.is/TODO | params folder }. If
   * not provided, the value will kept as is.
   */
  parser?: ParamParserType

  // TODO: allow customizing the name in the query string
  // queryKey?: string

  /**
   * Default value if the query parameter is missing or if the match fails
   * (e.g. a invalid number is passed to the int param parser). If not provided
   * and the param parser throws, the route will not match.
   */
  default?: (() => T) | T

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
 * TODO: native parsers ideas:
 * - json -> just JSON.parse(value)
 * - boolean -> 'true' | 'false' -> boolean
 * - number -> Number(value) -> NaN if not a number
 */
