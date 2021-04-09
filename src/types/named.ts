import { RouteRecordRaw, _RouteRecordBase } from '.'

type OptionalPropertyNames<T> = {
  [K in keyof T]-?: {} extends { [P in K]: T[K] } ? K : never
}[keyof T]

type SpreadProperties<L, R, K extends keyof L & keyof R> = {
  [P in K]: L[P] | Exclude<R[P], undefined>
}

type Id<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

type SpreadTwo<L, R> = Id<
  Pick<L, Exclude<keyof L, keyof R>> &
    Pick<R, Exclude<keyof R, OptionalPropertyNames<R>>> &
    Pick<R, Exclude<OptionalPropertyNames<R>, keyof L>> &
    SpreadProperties<L, R, OptionalPropertyNames<R> & keyof L>
>

type Spread<A extends readonly [...any]> = A extends [infer L, ...infer R]
  ? SpreadTwo<L, Spread<R>>
  : unknown

export type ExtractNamedRoutes<T> = [T] extends [ReadonlyArray<infer U>]
  ? ExtractNamedRoutes<NamedRoutes<U>>
  : ([T] extends [{ name: string }] ? { [K in T['name']]: unknown } : {}) &
      ([T] extends [{ children?: undefined | unknown | any }]
        ? T['children'] extends undefined
          ? {}
          : ExtractNamedRoutes<T['children']>
        : {})

type RouteFiller<T> = T extends { name: string; children: any }
  ? T
  : T extends { name: string }
  ? T & { children: never[] }
  : T extends { children: any }
  ? T & { name: '' }
  : { name: ''; children: never }

export type NamedRoutes<T> = RouteFiller<T>

// declare const xxx: NamedRoutes<
//   | {
//       name: 'LOL'
//     }
//   | { name: 'xxx' }
//   | { children: {} }
// >
// xxx.name

declare const typed: ExtractNamedRoutes<
  [
    {
      path: 'my-path'
      name: 'test'
      // children must be declared :(
      // children: []
    },
    {
      path: 'my-path'
      name: 'my-other-path'
      // children must be declared :(
      // children: []
    },
    {
      path: 'random'
      name: 'tt'
      children: [
        {
          path: 'random-child'
          name: 'random-child'
          // children: []
        }
      ]
    },
    {
      name: '1'
      children: [
        {
          name: '2'
          children: [{ name: '3'; children: [{ name: '4' }] }]
        }
      ]
    }
  ]
>

typed['my-other-path']
typed['random-child']
typed.test
typed.tt
typed[1]
typed[2]
typed[3]
typed[4]

export function defineRoutes<
  T extends Array<RouteRecordRaw | Readonly<RouteRecordRaw>>
>(routes: T): ExtractNamedRoutes<T> {
  return routes as any
}

export interface NamedLocationMap {}
