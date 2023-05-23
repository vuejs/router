import { JSDOM, ConstructorOptions } from 'jsdom'
import {
  NavigationGuard,
  RouteRecordMultipleViews,
  MatcherLocation,
  RouteLocationNormalized,
  RouteComponent,
  RouteRecordRaw,
  RouteRecordName,
  _RouteRecordProps,
} from '../src/types'
import { h, ComponentOptions } from 'vue'
import {
  RouterOptions,
  createWebHistory,
  createRouter,
  Router,
  RouterView,
  RouteRecordNormalized,
} from '../src'

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

export function nextNavigation(router: Router) {
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

export interface RouteRecordViewLoose
  extends Pick<
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
  name: RouteRecordName | null | undefined
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

declare global {
  namespace NodeJS {
    interface Global {
      window: JSDOM['window']
      location: JSDOM['window']['location']
      history: JSDOM['window']['history']
      document: JSDOM['window']['document']
      before?: Function
    }
  }
}

export function createDom(options?: ConstructorOptions) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body></body></html>`,
    {
      url: 'https://example.com/',
      referrer: 'https://example.com/',
      contentType: 'text/html',
      ...options,
    }
  )

  try {
    // @ts-expect-error: not the same window
    global.window = dom.window
    global.location = dom.window.location
    global.history = dom.window.history
    global.document = dom.window.document
  } catch (erro) {
    // it's okay, some are readonly
  }

  return dom
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

export function newRouter(
  options: Partial<RouterOptions> & { routes: RouteRecordRaw[] }
) {
  return createRouter({
    history: options.history || createWebHistory(),
    ...options,
  })
}
