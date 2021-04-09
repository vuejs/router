import { RouteRecordRaw, _RouteRecordBase } from '.'

export type ExtractNamedRoutes<T> = [T] extends [ReadonlyArray<infer U>]
  ? ExtractNamedRoutes<U>
  : ([T] extends [{ name: string }] ? { [K in T['name']]: unknown } : {}) &
      ([T] extends [{ children?: undefined | unknown | any }]
        ? ExtractNamedRoutes<T['children']>
        : {})

export function defineRoutes<
  T extends Array<RouteRecordRaw | Readonly<RouteRecordRaw>>
>(routes: T): ExtractNamedRoutes<T> {
  return routes as any
}

export interface NamedLocationMap {}
