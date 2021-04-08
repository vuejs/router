import { RouteLocationOptions, RouteRecordRaw, _RouteRecordBase } from '.'

// export type ExtractNameRoute<T extends Readonly<RouteRecordRaw>> =
//   | ([T] extends [{ name: string }] ? { [K in T['name']]: unknown } : never)
//   | ([T] extends [{ children: Readonly<RouteRecordRaw[]> }]
//       ? ExtractNamedRoutes<T['children']>
//       : never)

export type ExtractNamedRoute<T extends Readonly<_RouteRecordBase>> = [
  T
] extends [{ name: string; readonly children?: any[] }]
  ? { [K in T['name']]: unknown } &
      ([T['children']] extends [Readonly<Array<_RouteRecordBase>>]
        ? ExtractNamedRoutes<T['children']>
        : {})
  : never

export type ExtractNamedRoutes<
  T extends Readonly<Array<_RouteRecordBase>> | undefined
> = T extends Readonly<Array<infer R>>
  ? // ? [R] extends [{ name: string /*params?: infer Params*/ }]
    [R] extends [_RouteRecordBase]
    ? ExtractNamedRoute<R>
    : {}
  : never

// const routes = [
//   {
//     path: 'my-path',
//     name: 'test',
//     component: Comp,
//   },
//   {
//     path: 'my-path',
//     name: 'my-other-path',
//     component: Comp,
//   },
//   {
//     path: 'random',
//     name: 'tt',
//     children: [
//       {
//         path: 'random-child',
//         name: 'random-child',
//         component: Comp,
//       },
//     ],
//   },
// ] as const

// type TypedRoutes = ExtractNamedRoutes<typeof routes>

// declare const Comp: () => any

// const routes = [
//   {
//     path: 'my-path',
//     name: 'test',
//     component: Comp,
//   },
//   {
//     path: 'my-path',
//     // name: 'my-other-path',
//     component: Comp,
//   },
// ] as const

// type XXX = ExtractNamedRoutes<
//   Readonly<
//     [
//       {
//         path: 'ttt'
//         name: 'sddsd'
//         component: any
//         children: [
//           {
//             path: 'ttt'
//             name: 'child'
//             component: any
//           },
//           {
//             path: 'ttt'
//             name: 'child-other'
//             component: any
//           }
//         ]
//       }
//     ]
//   >
// >

// interface XXW extends XXX {}

// const xxx2: XXW
// type TypedRoutes = ExtractNamedRoutes<typeof routes>

//   export type ExtractNamedRoutes<
//   T extends Array<RouteRecordRaw> | Readonly<Array<RouteRecordRaw>>
// > = T extends Array<infer R>
//   ? [R] extends [{ name: string /*params?: infer Params*/ }]
//     ? {
//         [K in R['name']]: unknown /*TODO add params*/ /*R['params'] extends Params ? Params : Params*/
//       }
//     : never
//   : T extends Readonly<Array<infer R>>
//   ? [R] extends [{ name: string /*params?: infer Params*/ }]
//     ? {
//         [K in R['name']]: unknown /*TODO add params*/ /*R['params'] extends Params ? Params : Params*/
//       }
//     : never
//   : never

export function defineRoutes<
  T extends Array<RouteRecordRaw | Readonly<RouteRecordRaw>>
>(routes: T): ExtractNamedRoutes<T> {
  return routes as any
}
export interface NamedLocationMap {}

export interface RouteNamedLocation<
  T extends keyof NamedLocationMap = keyof NamedLocationMap
> extends RouteLocationOptions {
  name: T
  // params: NamedLocationMap[T]
}

// declare const r: [
//   {
//     name: 'test'
//     params: {
//       number: 1
//     }
//   },
//   {
//     name: 'LOL'
//     params: {
//       sss: 'sss'
//     }
//   },
//   {
//     name: 'other'
//   },
//   {
//     path: 'ssss'
//   }
// ]

// declare const x: ExtractNamedRoutes<typeof r>
