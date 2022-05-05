import type { RouteParams, RouteParamsRaw, RouteRecordRaw } from '.'
import type { JoinPath, ParamsFromPath, ParamsRawFromPath } from './paths'

export type RouteNamedMap<
  Routes extends Readonly<RouteRecordRaw[]>,
  Prefix extends string = ''
> = Routes extends readonly [infer R, ...infer Rest]
  ? Rest extends Readonly<RouteRecordRaw[]>
    ? (R extends {
        name?: infer Name
        path: infer Path
        children?: infer Children
      }
        ? Path extends string
          ? (Name extends string | symbol
              ? {
                  [N in Name]: {
                    // name: N
                    params: ParamsFromPath<JoinPath<Prefix, Path>>
                    // TODO: ParamsRawFromPath
                    paramsRaw: ParamsRawFromPath<JoinPath<Prefix, Path>>
                    path: JoinPath<Prefix, Path>
                  }
                }
              : {
                  // NO_NAME: 1
                }) &
              // Recurse children
              (Children extends Readonly<RouteRecordRaw[]>
                ? RouteNamedMap<Children, JoinPath<Prefix, Path>>
                : {
                    // NO_CHILDREN: 1
                  })
          : never // Path must be a string
        : {
            // EMPTY: 1
          }) &
        RouteNamedMap<Rest, Prefix>
    : never // R must be a valid route record
  : {
      // END: 1
    }

export type RouteNamedMapGeneric = Record<
  string | symbol | number,
  // TODO: use RouteParams, RouteParamRaw
  {
    params: RouteParams
    paramsRaw: RouteParamsRaw
    path: string
  }
>
