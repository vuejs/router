import type {
  RouteParams,
  RouteParamsRaw,
  RouteRecordRaw,
  RouteRecordName,
} from '.'
import type {
  _JoinPath,
  ParamsFromPath,
  ParamsRawFromPath,
  PathFromParams,
} from './paths'
import { LiteralUnion } from './utils'

/**
 * Creates a map with each named route as a properties. Each property contains the type of the params in raw and
 * normalized versions as well as the raw path.
 * @internal
 */
export type RouteNamedMap<
  Routes extends Readonly<RouteRecordRaw[]>,
  Prefix extends string = ''
> = Routes extends readonly [infer R, ...infer Rest]
  ? Rest extends Readonly<RouteRecordRaw[]>
    ? (R extends _RouteRecordNamedBaseInfo<
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

/**
 * Type that adds valid semi literal paths to still enable autocomplete while allowing proper paths
 */
type _PathForAutocomplete<P extends string> = P extends `${string}:${string}`
  ? LiteralUnion<P, PathFromParams<P>>
  : P

/**
 * @internal
 */
export type _PathWithHash<P extends string> = `${P}#${string}`

/**
 * @internal
 */
export type _PathWithQuery<P extends string> = `${P}?${string}`

/**
 * @internal
 */
export type _FullPath<P extends string> = LiteralUnion<
  P,
  _PathWithHash<P> | _PathWithQuery<P>
>

/**
 * @internal
 */
export type RouteStaticPathMap<
  Routes extends Readonly<RouteRecordRaw[]>,
  Prefix extends string = ''
> = Routes extends readonly [infer R, ...infer Rest]
  ? Rest extends Readonly<RouteRecordRaw[]>
    ? (R extends _RouteRecordNamedBaseInfo<
        infer _Name,
        infer Path,
        infer Children
      >
        ? {
            // TODO: add | ${string} for params
            // TODO: add extra type to append  ? and # variants
            [P in Path as _JoinPath<Prefix, Path>]: {
              path: _PathForAutocomplete<_JoinPath<Prefix, Path>>
              fullPath: _FullPath<_PathForAutocomplete<_JoinPath<Prefix, Path>>>
            }
          } & (Children extends Readonly<RouteRecordRaw[]> // Recurse children
            ? RouteStaticPathMap<Children, _JoinPath<Prefix, Path>>
            : {
                // NO_CHILDREN: 1
              })
        : never) & // R must be a valid route record
        // recurse children
        RouteStaticPathMap<Rest, Prefix>
    : {
        // EMPTY: 1
      }
  : {
      // END: 1
    }

/**
 * Important information in a Named Route Record
 * @internal
 */
export interface _RouteRecordNamedBaseInfo<
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
 *
 * @internal
 */
export type RouteNamedMapGeneric = Record<RouteRecordName, RouteNamedInfo>

/**
 * Generic map of routes paths from a list of route records.
 *
 * @internal
 */
export type RouteStaticPathMapGeneric = Record<
  string,
  { path: string; fullPath: string }
>

/**
 * Relevant information about a named route record to deduce its params.
 * @internal
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
