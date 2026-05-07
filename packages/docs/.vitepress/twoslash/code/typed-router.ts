/* prettier-ignore */
import type { RouteRecordInfo } from 'vue-router'

declare module 'vue-router' {
  interface TypesConfig {
    ParamParsers: never
    RouteNamedMap: import('vue-router/auto-routes').RouteNamedMap
  }
}

declare module 'vue-router/auto-routes' {
  export interface RouteNamedMap {
    '/': RouteRecordInfo<
      '/',
      '/',
      Record<never, never>,
      Record<never, never>,
      never
    >
    '/books/[id]': RouteRecordInfo<
      '/books/[id]',
      '/books/:id',
      { id: string },
      { id: string },
      never
    >
    '/users': RouteRecordInfo<
      '/users',
      '/users',
      Record<never, never>,
      Record<never, never>,
      never
    >
    '/users/[id]': RouteRecordInfo<
      '/users/[id]',
      '/users/:id',
      { id: string | number },
      { id: string },
      '/users/[id]/edit'
    >
    '/users/[id]/edit': RouteRecordInfo<
      '/users/[id]/edit',
      '/users/:id/edit',
      { id: string | number },
      { id: string },
      never
    >
  }
}
