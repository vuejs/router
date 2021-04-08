// NOTE `ExtractNamedRoutes` is not exposed on build, you might need to add export to the type manually

import { ExtractNamedRoutes, Router } from './index'
import { DefineComponent } from 'vue'

declare const Comp: DefineComponent

const routes = [
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
]

type TypedRoutes = ExtractNamedRoutes<typeof routes>

declare module './index' {
  interface NamedLocationMap extends TypedRoutes {}
}

declare const router: Router

router.push({
  name: '',
})
