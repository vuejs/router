/// <reference types="vite/client" />
/// <reference path="vue-router/global.d.ts"/>

// declare module '*.vue' {
//   import { Component } from 'vue'
//   var component: Component
//   export default component
// }

declare module '@vue-router' {
  import type { Ref } from 'vue'

  export interface LoaderResult<Load> {
    data: Load extends _Loader<any, infer R> ? R : unknown
    isLoading: Ref<boolean>
  }

  export function useLoader<Name extends RouteNames>(
    name?: Name
  ): RouteNamedMap[Name]

  export interface _Loader<Params, Result> {
    (to: { params: Params }): Promise<Result>
  }

  export function defineLoader<Name extends RouteNames, Result>(
    name: Name,
    loader: _Loader<RouteParams<Name>, Result>
  ): _Loader<RouteParams<Name>, Result>

  export type RouteNames = 'user' | 'admin' | 'home' | 'about'

  export interface RouteNamedMap {
    user: LoaderResult<typeof import('./src/views/UserDetail.vue').load>
  }

  export type RouteParams<Name extends RouteNames> = {
    user: { id: string }
  }[Name]
}
