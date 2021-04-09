import { ExtractNamedRoutes, Router } from './index'
import { DefineComponent } from 'vue'

declare const Comp: DefineComponent

const routes = [
  {
    path: 'my-path',
    name: 'test',
    component: Comp,
  },
  {
    path: 'my-path',
    name: 'my-other-path',
    component: Comp,
  },
  {
    path: 'random',
    name: 'tt',
    children: [
      {
        path: 'random-child',
        name: 'random-child',
        component: Comp,
      },
    ],
  },
] as const

type TypedRoutes = ExtractNamedRoutes<typeof routes>

declare module './index' {
  interface NamedLocationMap {
    'my-other-path': {
      sss: number
    }
  }
}

declare const router: Router

router.push({
  name: 'my-other-path',
  params: {
    sss: 1,
    // @ts-expect-error
    xxxx: '22',
  },
})

router.push({
  // @ts-expect-error location name does not exist
  name: 'random-location',
})
