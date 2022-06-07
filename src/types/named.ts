import type {
  RouteParams,
  RouteParamsRaw,
  RouteRecordRaw,
  RouteRecordName,
} from '.'
import type { _JoinPath, ParamsFromPath, ParamsRawFromPath } from './paths'

export type RouteNamedMap<
  Routes extends Readonly<RouteRecordRaw[]>,
  Prefix extends string = ''
> = Routes extends readonly [infer R, ...infer Rest]
  ? Rest extends Readonly<RouteRecordRaw[]>
    ? (R extends _RouteNamedRecordBaseInfo<
        infer Name,
        infer Path,
        infer Children
      >
        ? (Name extends RouteRecordName
            ? {
                [N in Name]: {
                  // name: N
                  params: ParamsFromPath<_JoinPath<Prefix, Path>>
                  // TODO: ParamsRawFromPath
                  paramsRaw: ParamsRawFromPath<_JoinPath<Prefix, Path>>
                  path: _JoinPath<Prefix, Path>
                }
              }
            : {
                // NO_NAME: 1
              }) &
            // Recurse children
            (Children extends Readonly<RouteRecordRaw[]>
              ? RouteNamedMap<Children, _JoinPath<Prefix, Path>>
              : {
                  // NO_CHILDREN: 1
                })
        : {
            // EMPTY: 1
          }) &
        RouteNamedMap<Rest, Prefix>
    : never // R must be a valid route record
  : {
      // END: 1
    }

export interface _RouteNamedRecordBaseInfo<
  Name extends RouteRecordName = RouteRecordName, // we don't care about symbols
  Path extends string = string,
  Children extends Readonly<RouteRecordRaw[]> = Readonly<RouteRecordRaw[]>
> {
  name?: Name
  path: Path
  children?: Children
}

/**
 * Generic map of named routes from a list of route records.
 */
export type RouteNamedMapGeneric = Record<RouteRecordName, RouteNamedInfo>

/**
 * Relevant information about a named route record to deduce its params.
 */
export interface RouteNamedInfo<
  Path extends string = string,
  Params extends RouteParams = RouteParams,
  ParamsRaw extends RouteParamsRaw = RouteParamsRaw
> {
  params: Params
  paramsRaw: ParamsRaw
  path: Path
}
