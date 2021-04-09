import { RouteRecordRaw, _RouteRecordBase } from '.'

export type ExtractNamedRoutes<T> = [T] extends [ReadonlyArray<infer U>]
  ? ExtractNamedRoutes<U>
  : ([T] extends [{ name: string }] ? { [K in T['name']]: unknown } : {}) &
      ([T] extends [{ children?: undefined | unknown | any }]
        ? ExtractNamedRoutes<T['children']>
        : {})

// declare const test: ExtractNamedRoutes<
//   [
//     {
//       path: 'my-path'
//       name: 'test'
//       children: []
//     },
//     {
//       path: 'my-path'
//       name: 'my-other-path'
//       // children: []
//     },
//     {
//       path: 'random'
//       name: 'tt'
//       children: [
//         {
//           path: 'random-child'
//           name: 'random-child'
//         }
//       ]
//     }
//   ]
// >
// test
// test['my-other-path']
// test.test, test.tt
// test['random-child']

export function defineRoutes<
  T extends Array<RouteRecordRaw | Readonly<RouteRecordRaw>>
>(routes: T): ExtractNamedRoutes<T> {
  return routes as any
}

export interface NamedLocationMap {}
