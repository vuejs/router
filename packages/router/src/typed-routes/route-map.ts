import type { TypesConfig } from '../config'
import type { RouteParamsGeneric, RouteParamsRawGeneric } from '../types'
import type { RouteRecord } from '../matcher/types'

/**
 * Helper type to define a Typed `RouteRecord`
 * @see {@link RouteRecord}
 */
export interface RouteRecordInfo<
  // the name cannot be nullish here as that would not allow type narrowing
  Name extends string | symbol = string,
  Path extends string = string,
  // TODO: could probably be inferred from the Params
  ParamsRaw extends RouteParamsRawGeneric = RouteParamsRawGeneric,
  Params extends RouteParamsGeneric = RouteParamsGeneric,
  // NOTE: this is the only type param that feels wrong because its default
  // value is the default value to avoid breaking changes but it should be the
  // generic version by default instead (string | symbol)
  ChildrenNames extends string | symbol = never,
  // TODO: implement meta with a defineRoute macro
  // Meta extends RouteMeta = RouteMeta,
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  childrenNames: ChildrenNames
  // TODO: implement meta with a defineRoute macro
  // meta: Meta
}

export type RouteRecordInfoGeneric = RouteRecordInfo<
  string | symbol,
  string,
  RouteParamsRawGeneric,
  RouteParamsGeneric,
  string | symbol
>

/**
 * Convenience type to get the typed RouteMap or a generic one if not provided. It is extracted from the {@link TypesConfig} if it exists, it becomes {@link RouteMapGeneric} otherwise.
 */
export type RouteMap =
  TypesConfig extends Record<'RouteNamedMap', infer RouteNamedMap>
    ? RouteNamedMap
    : RouteMapGeneric

/**
 * Generic version of the `RouteMap`.
 */
export type RouteMapGeneric = Record<string | symbol, RouteRecordInfoGeneric>
