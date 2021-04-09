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
