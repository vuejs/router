import type { TypesConfig } from '../config'
import type { RouteMeta, RouteParams, RouteParamsRaw } from '../types'
import type { RouteRecord } from '../matcher/types'

/**
 * Helper type to define a Typed `RouteRecord`
 * @see {@link RouteRecord}
 */
export interface RouteRecordInfo<
  Name extends string | symbol = string,
  Path extends string = string,
  // TODO: could probably be inferred from the Params
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw,
  Params extends RouteParams = RouteParams,
  Meta extends RouteMeta = RouteMeta
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  // TODO: implement meta with a defineRoute macro
  meta: Meta
}

/**
 * Convenience type to get the typed RouteMap or a generic one if not provided.
 */
export type RouteMap = TypesConfig extends Record<
  'RouteNamedMap',
  infer RouteNamedMap
>
  ? RouteNamedMap
  : _RouteMapGeneric

/**
 * Generic version of the RouteMap.
 * @internal
 */
export type _RouteMapGeneric = Record<string | symbol, RouteRecordInfo>
