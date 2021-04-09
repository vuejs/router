import { RouteRecordRaw, _RouteRecordBase } from '.'

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
  ? T & { children: never[] }
  : T extends { children: any }
  ? T & { name: '' }
  : { name: ''; children: never }

// // declare const xxx: NamedRoutes<
// //   | {
// //       name: 'LOL'
// //     }
// //   | { name: 'xxx' }
// //   | { children: {} }
// // >
// // xxx.name

// declare const typed: ExtractNamedRoutes<
//   [
//     {
//       path: 'my-path'
//       name: 'test'
//       // children must be declared :(
//       // children: []
//     },
//     {
//       path: 'my-path'
//       name: 'my-other-path'
//       // children must be declared :(
//       // children: []
//     },
//     {
//       path: 'random'
//       name: 'tt'
//       children: [
//         {
//           path: 'random-child'
//           name: 'random-child'
//           // children: []
//         }
//       ]
//     },
//     {
//       name: '1'
//       children: [
//         {
//           name: '2'
//           children: [{ name: '3'; children: [{ name: '4' }] }]
//         }
//       ]
//     }
//   ]
// >

// typed['my-other-path']
// typed['random-child']
// typed.test
// typed.tt
// typed[1]
// typed[2]
// typed[3]
// typed[4]

export function defineRoutes<
  T extends Array<RouteRecordRaw | Readonly<RouteRecordRaw>>
>(routes: T): ExtractNamedRoutes<T> {
  return routes as any
}

export interface NamedLocationMap {}
