import {
  RouteRecordMultipleViews,
  MatcherLocation,
  RouteComponent,
  RouteRecordRaw,
} from '../src/types'
import {
  h,
  ComponentOptions,
  template,
  createIf,
  createComponent,
  setInsertionState,
  txt,
  renderEffect,
  setText,
} from 'vue'
import {
  RouterOptions,
  createWebHistory,
  createRouter,
  Router,
  RouterView,
  RouteRecordNormalized,
  NavigationGuard,
  RouteLocationNormalized,
  VaporRouterView,
} from '../src'
import { _RouteRecordProps } from '../src/typed-routes'
import { type EXPERIMENTAL_Router } from '../src/experimental'

export const tick = (time?: number) =>
  new Promise(resolve => {
    if (time) setTimeout(resolve, time)
    else process.nextTick(resolve)
  })

export async function ticks(n: number) {
  for (let i = 0; i < n; i++) {
    await tick()
  }
}

export const delay = (t: number) => new Promise(r => setTimeout(r, t))

export function nextNavigation(router: Router | EXPERIMENTAL_Router) {
  return new Promise((resolve, reject) => {
    let removeAfter = router.afterEach((_to, _from, failure) => {
      removeAfter()
      removeError()
      resolve(failure)
    })
    let removeError = router.onError(err => {
      removeAfter()
      removeError()
      reject(err)
    })
  })
}

export interface RouteRecordViewLoose extends Pick<
  RouteRecordMultipleViews,
  'path' | 'name' | 'meta' | 'beforeEnter'
> {
  leaveGuards?: any
  updateGuards?: any
  instances: Record<string, any>
  enterCallbacks: Record<string, Function[]>
  props: Record<string, _RouteRecordProps>
  aliasOf: RouteRecordNormalized | RouteRecordViewLoose | undefined
  children?: RouteRecordRaw[]
  components: Record<string, RouteComponent> | null | undefined
}

// @ts-expect-error we are intentionally overriding the type
export interface RouteLocationNormalizedLoose extends RouteLocationNormalized {
  name: string | symbol | null | undefined
  path: string
  // record?
  params: any
  redirectedFrom?: Partial<MatcherLocation>
  meta: any
  matched: Partial<RouteRecordViewLoose>[]
}

export interface MatcherLocationNormalizedLoose {
  name: string
  path: string
  // record?
  params: any
  redirectedFrom?: Partial<MatcherLocation>
  meta: any
  matched: Partial<RouteRecordViewLoose>[]
  instances: Record<string, any>
}

export const noGuard: NavigationGuard = (to, from, next) => {
  next()
}

export const components = {
  Home: { render: () => h('div', {}, 'Home') },
  Foo: { render: () => h('div', {}, 'Foo') },
  Bar: { render: () => h('div', {}, 'Bar') },
  User: {
    props: {
      id: {
        default: 'default',
      },
    },
    render() {
      return h('div', {}, 'User: ' + this.id)
    },
  } as ComponentOptions,
  WithProps: {
    props: {
      id: {
        default: 'default',
      },
      other: {
        default: 'other',
      },
    },
    render() {
      return h('div', {}, `id:${this.id};other:${this.other}`)
    },
  } as RouteComponent,
  Nested: {
    render: () => {
      return h('div', {}, [
        h('h2', {}, 'Nested'),
        RouterView ? h(RouterView) : [],
      ])
    },
  },
  BeforeLeave: {
    render: () => h('div', {}, 'before leave'),
    beforeRouteLeave(to, from, next) {
      next()
    },
  } as RouteComponent,
}

export const vaporComponents = {
  Home: { setup: () => template('<div>Home')() },
  Foo: { render: () => template('<div>Foo')() },
  Bar: { render: () => template('<div>Bar')() },
  User: {
    props: {
      id: {
        default: 'default',
      },
    },
    setup(props: any) {
      const n0 = template('<div> ', true)()
      const x0 = txt(n0 as any)
      renderEffect(() => setText(x0 as any, `User: ${props.id}`))
      return n0
    },
  } as ComponentOptions,
  WithProps: {
    props: {
      id: {
        default: 'default',
      },
      other: {
        default: 'other',
      },
    },
    setup(props: any) {
      const n0 = template('<div> ', true)()
      const x0 = txt(n0 as any)
      renderEffect(() =>
        setText(x0 as any, 'id:' + props.id + ';other:' + props.other)
      )
      return n0
    },
  } as RouteComponent,
  Nested: {
    render: () => {
      const n3 = template('<div><h2>Nested', true)()
      setInsertionState(n3 as any, null, 1, true)
      createIf(
        () => VaporRouterView,
        () => {
          const n2 = createComponent(VaporRouterView)
          return n2
        }
      )
      return n3
    },
  },
  BeforeLeave: {
    render: () => h('div', {}, 'before leave'),
    beforeRouteLeave(to, from, next) {
      next()
    },
  } as RouteComponent,
}

export function newRouter(
  options: Partial<RouterOptions> & { routes: RouteRecordRaw[] }
) {
  return createRouter({
    history: options.history || createWebHistory(),
    ...options,
  })
}
