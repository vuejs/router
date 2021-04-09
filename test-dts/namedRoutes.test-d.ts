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
  {
    name: '1',
    children: [
      {
        name: '2',
        children: [
          {
            name: '3',
            children: [{ name: '4' }, { path: '', children: [{ name: '5' }] }],
          },
        ],
      },
    ],
  },
] as const

declare const typed: ExtractNamedRoutes<typeof routes>

typed['my-other-path']
typed['random-child']
typed.test
typed.tt
typed[1]
typed[2]
typed[3]
typed[4]
typed[5]
//@ts-expect-error
typed['non-existing']

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
    // @ts-expect-error does not exist
    xxxx: '22',
  },
})

router.push({
  // @ts-expect-error location name does not exist
  name: 'random-location',
})
