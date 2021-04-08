import { RouteLocationOptions, RouteRecordRaw } from '.'

export type ExtractNamedRoutes<
  T extends Array<RouteRecordRaw>
> = T extends Array<infer R>
  ? [R] extends [{ name: string /*params?: infer Params*/ }]
    ? {
        [K in R['name']]: unknown /*TODO add params*/ /*R['params'] extends Params ? Params : Params*/
      }
    : never
  : never

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

export interface RouteNamedLocation<T extends keyof NamedLocationMap>
  extends RouteLocationOptions {
  name: T
  params: NamedLocationMap[T]
}

declare const r: [
  {
    name: 'test'
    params: {
      number: 1
    }
  },
  {
    name: 'LOL'
    params: {
      sss: 'sss'
    }
  },
  {
    name: 'other'
  },
  {
    path: 'ssss'
  }
]

declare const x: ExtractNamedRoutes<typeof r>
