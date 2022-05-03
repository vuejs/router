import {
  ExtractNamedRoutes,
  Router,
  ExtractRoutes,
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  expectType,
  RouteNamedMap,
} from './index'
import { DefineComponent } from 'vue'
import { JoinPath } from 'src/types/paths'

declare const Comp: DefineComponent
declare const component: DefineComponent
declare const components: { default: DefineComponent }

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

export function defineRoutes<
  Path extends string,
  Routes extends Readonly<RouteRecordRaw<Path>[]>
>(routes: Routes): Routes {
  return routes
}

const r2 = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/users/:id', name: 'UserDetails', component },
    { path: '/no-name', /* no name */ component },
    {
      path: '/nested',
      name: 'nested',
      children: [
        {
          path: ':a',
          name: 'nested-a',
          children: [
            {
              path: 'b',
              children: [{ path: ':c', name: 'nested-c', component }],
            },
          ],
        },
      ],
    },
  ] as const,
})

function joinPath<A extends string, B extends string>(
  prefix: A,
  path: B
): JoinPath<A, B> {
  return '' as any
}

function createMap<R extends Readonly<RouteRecordRaw[]>>(
  routes: R
): RouteNamedMap<R> {
  return {} as any
}

expectType<'/nested/:a'>(joinPath('/nested', ':a'))
expectType<'/nested/:a'>(joinPath('/nested/', ':a'))
expectType<'/:a'>(joinPath('/nested', '/:a'))

expectType<{
  UserDetails: { id: string }
  nested: {}
  'nested-a': { a: string }
  'nested-c': { a: string; c: string }
}>(createMap(r2.options.routes))

expectType<{
  UserDetails: { nope: string }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  'nested-c': { a: string; d: string }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  nope: {}
  // @ts-expect-error
}>(createMap(r2.options.routes))

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
      id: string
    }
  }
}

declare const router: Router

router.push({
  name: 'my-other-path',
  params: {
    id: '222',
    // @ts-expect-error does not exist
    nonExistent: '22',
  },
})

router.push({
  // @ts-expect-error location name does not exist
  name: 'random-location',
})

const otherRouter = createRouter({
  history: {} as any,
  routes: [{ path: 'e', name: 'test', component: Comp }] as const,
})

declare const otherRoutes: ExtractRoutes<typeof otherRouter>

otherRoutes.test
// @ts-expect-error
otherRoutes.test2
