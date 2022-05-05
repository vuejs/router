import {
  createRouter,
  createWebHistory,
  RouteRecordRaw,
  expectType,
  RouteNamedMap,
  RouterTyped,
  RouteLocationRaw,
  JoinPath,
} from './index'
import { DefineComponent } from 'vue'

declare const component: DefineComponent
declare const components: { default: DefineComponent }

const routeName = Symbol()

const r2 = createRouter({
  history: createWebHistory(),
  routes: [
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
  // any path is still valid
  r2[method]('/path')
  r2.push('/path')
  r2.replace('/path')
  // relative push can have any of the params
  r2[method]({ params: { a: 2 } })
  r2[method]({ params: {} })
  r2[method]({ params: { opt: 'hey' } })
  // FIXME: is it possible to support this version
  // // @ts-expect-error: does not accept any params
  // r2[method]({ name: 'nested', params: { eo: 'true' } })
}

r2.push({} as unknown as RouteLocationRaw)
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

function getTypedRouter(): RouterTyped {
  return {} as any
}

const typedRouter = getTypedRouter()
// this one is true if we comment out the line with Router: typeof r2
// expectType<Router>(typedRouter)
expectType<typeof r2>(typedRouter)
typedRouter.push({ name: 'UserDetails' })
// @ts-expect-error
typedRouter.push({ name: 'nope' })
