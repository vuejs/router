import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  expectType,
  RouteNamedMap,
  RouteLocationRaw,
  JoinPath,
  useRouter,
} from './index'
import { DefineComponent } from 'vue'

declare const component: DefineComponent
declare const components: { default: DefineComponent }

const routeName = Symbol()

const r2 = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component },
    { path: '/foo', component },
    { path: '/users/:id', name: 'UserDetails', component },
    { path: '/no-name', /* no name */ components },
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
        { path: ':opt?', name: 'optional', component },
        // still skipped
        { path: 'other', name: routeName, component },
      ],
    },
  ] as const,
})

const methods = ['push', 'replace'] as const
for (const method of methods) {
  r2.push({ name: 'UserDetails' })
  r2.replace({ name: 'UserDetails' })

  // accepts missing params because of relative locations is valid
  r2[method]({ name: 'UserDetails' })
  // @ts-expect-error: but expects a correct id
  r2[method]({ name: 'UserDetails', params: {} })
  // @ts-expect-error: no invalid params
  r2[method]({ name: 'UserDetails', params: { id: '2', nope: 'oops' } })
  // other options are valid
  r2[method]({ name: 'UserDetails', query: { valid: 'true' }, replace: true })
  r2[method]({ name: 'UserDetails', params: { id: '2' } })
  // accepts numbers
  r2[method]({ name: 'UserDetails', params: { id: 2 } })
  // @ts-expect-error: fails on null
  r2[method]({ name: 'UserDetails', params: { id: null } })
  // @ts-expect-error: and undefined
  r2[method]({ name: 'UserDetails', params: { id: undefined } })
  // nested params work too
  r2[method]({ name: 'nested-c', params: { a: '2', c: '3' } })
  r2[method]({ name: 'optional' })
  // optional params are more flexible
  r2[method]({ name: 'optional', params: {} })
  r2[method]({ name: 'optional', params: { opt: 'hey' } })
  r2[method]({ name: 'optional', params: { opt: null } })
  r2[method]({ name: 'optional', params: { opt: undefined } })
  // works with symbols too
  r2[method]({ name: routeName })
  // @ts-expect-error: but not other symbols
  r2[method]({ name: Symbol() })
  // relative push can have any of the params
  r2[method]({ params: { a: 2 } })
  r2[method]({ params: {} })
  r2[method]({ params: { opt: 'hey' } })
  // @ts-expect-error: but not non existent
  r2[method]({ params: { fake_param: 'hey' } })

  // routes with no params
  r2[method]({ name: 'nested' })
  r2[method]({ name: 'nested', params: {} })
  // FIXME: is it possible to support this version
  // @ts-expect-error: does not accept any params
  r2[method]({ name: 'nested', params: { id: 2 } })

  // paths
  r2[method]({ path: '/nested' })
  r2[method]({ path: '/nested/:a/b' })
  // with an actual param
  r2[method]({ path: '/nested/a/b' })
  // NOTE: we actually accept any string because of perf bottlenecks due to tuples
  r2[method]({ path: '' })
  r2[method]({ path: '/nope' })
  r2[method]({ path: '/no-name?query' })
  r2[method]({ path: '/no-name#hash' })

  r2[method]('/nested')
  r2[method]('/nested/a/b')

  // NOTE: same as above
  r2[method]('')
  r2[method]('/nope')
  r2[method]('/no-name?query')
  r2[method]('/no-name#hash')
}

// NOTE: not possible if we use the named routes as the point is to provide valid routes only
// @ts-expect-error
r2.push({} as unknown as RouteLocationRaw)
// @ts-expect-error
r2.replace({} as unknown as RouteLocationRaw)

// createMap(r2.options.routes, true).

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
  UserDetails: { params: { id: string }; path: '/users/:id' }
  nested: { params: {}; path: '/nested' }
  'nested-a': { params: { a: string }; path: '/nested/:a' }
  'nested-c': { params: { a: string; c: string }; path: '/nested/:a/b/:c' }
}>(createMap(r2.options.routes))

expectType<{
  UserDetails: { params: { nope: string } }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  UserDetails: { path: '/users' }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  'nested-c': { path: '/' }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  'nested-c': { params: { a: string; d: string } }
  // @ts-expect-error
}>(createMap(r2.options.routes))
expectType<{
  nope: { params: {} }
  // @ts-expect-error
}>(createMap(r2.options.routes))

// declare module '../src' {
declare module '../dist/vue-router' {
  export interface Config {
    Router: typeof r2
  }
}

const typedRouter = useRouter()
// this one is true if we comment out the line with Router: typeof r2
// expectType<Router>(typedRouter)
expectType<typeof r2>(typedRouter)
typedRouter.push({ name: 'UserDetails' })
// @ts-expect-error
typedRouter.push({ name: 'nope' })
