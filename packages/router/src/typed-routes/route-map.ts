import type { TypesConfig } from '../config'
import type {
  RouteMeta,
  RouteParamsGeneric,
  RouteParamsRawGeneric,
} from '../types'
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
  Meta extends RouteMeta = RouteMeta,
  _ChildrenRouteNames extends string | symbol = never,
> {
  name: Name
  path: Path
  paramsRaw: ParamsRaw
  params: Params
  // TODO: implement meta with a defineRoute macro
  meta: Meta
}

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
export type RouteMapGeneric = Record<string | symbol, RouteRecordInfo>

/**
 * Returns a union of route names from children of the route with given route name
 */
export type GetDeepChildrenRouteNames<Name extends keyof RouteMap> =
  RouteMap[Name] extends RouteRecordInfo<
    any,
    any,
    any,
    any,
    any,
    infer ChildrenNames
  >
    ? ChildrenNames extends any
      ? ChildrenNames | GetDeepChildrenRouteNames<ChildrenNames>
      : never
    : never

/**
 * Returns a union of given route name and the route names of children of that route
 */
export type RouteNameWithChildren<Name extends keyof RouteMap> =
  RouteMapGeneric extends RouteMap
    ? Name
    : Name | GetDeepChildrenRouteNames<Name>
