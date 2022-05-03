import type { RouteRecordRaw } from '.'
import type { Router } from '../router'
import { JoinPath, ParamsFromPath } from './paths'

/**
 * This will flat the routes into an object with `key` === `router.name`
 * and the value will be `unknown` since we don't have way to describe params types
 */
export type ExtractNamedRoutes<T> = [T] extends [ReadonlyArray<infer U>]
  ? ExtractNamedRoutes<RouteFix<U>>
  : ([T] extends [{ name: string }] ? { [K in T['name']]: unknown } : {}) &
      ([T] extends [{ children?: undefined | unknown | any }]
        ? T['children'] extends undefined
          ? {}
          : ExtractNamedRoutes<T['children']>
        : {})

// Needed to populate the missing props
type RouteFix<T> = T extends { name: string; children: any }
  ? T
  : T extends { name: string }
  ? T & { children: never }
  : T extends { children: any }
  ? T & { name: never }
  : { name: never; children: never }

export type ExtractRoutes<T extends Router> = ExtractNamedRoutes<
  T['options']['routes']
>

/**
 * Used to define typed named locations
 * @example
 * ```ts
 * declare module 'vue-router' {
 *   interface NamedLocationMap {
 *    // 'home' no params
 *    home: {}
 *    // 'product' `{id: string}` required parameter
 *    product: {
 *      id: string
 *    }
 *   }
 * }
 * ```
 */
export interface NamedLocationMap {}

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
          ? (Name extends string
              ? {
                  [N in Name]: ParamsFromPath<JoinPath<Prefix, Path>>
                }
              : {
                  // NO_NAME: 1
                }) &
              (Children extends Readonly<RouteRecordRaw[]>
                ? RouteNamedMap<Children, JoinPath<Prefix, Path>>
                : {
                    // NO_CHILDREN: 1
                  })
          : never // Path must be a string
        : {
            // EMPTY: 1
          }) &
        RouteNamedMap<Rest>
    : never // R must be a valid route record
  : {
      // END: 1
    }
