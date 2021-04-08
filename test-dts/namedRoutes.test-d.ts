import { defineRoutes } from './index'
import { DefineComponent } from 'vue'

declare const Comp: DefineComponent

const routes = defineRoutes([
  {
    path: 'my-path',
    name: 'test',
    component: Comp,
  } as const,
  {
    path: 'my-path',
    name: 'my-other-path',
    component: Comp,
  } as const,

  // {
  //   path: 'my-path',
  //   component: Comp,
  // } as const,
])

declare module './index' {
  interface RouteMeta {
    requiresAuth?: boolean
    nested: { foo: string }
  }
}
