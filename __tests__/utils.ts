import { JSDOM, ConstructorOptions } from 'jsdom'
import {
  NavigationGuard,
  RouteRecordMultipleViews,
  MatcherLocationNormalized,
  RouteLocationNormalized,
  RouteRecordCommon,
  RouteComponent,
} from '../src/types'
import { h, resolveComponent, ComponentOptions } from 'vue'

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

export interface RouteRecordViewLoose
  extends Pick<
    RouteRecordMultipleViews,
    'path' | 'name' | 'components' | 'children' | 'meta' | 'beforeEnter'
  > {
  leaveGuards?: any
  instances: Record<string, any>
  props?: RouteRecordCommon['props']
  aliasOf: RouteRecordViewLoose | undefined
}

// @ts-ignore we are intentionally overriding the type
export interface RouteLocationNormalizedLoose extends RouteLocationNormalized {
  name: string | undefined
  path: string
  // record?
  params: any
  redirectedFrom?: Partial<MatcherLocationNormalized>
  meta: any
  matched: Partial<RouteRecordViewLoose>[]
}

export interface MatcherLocationNormalizedLoose {
  name: string
  path: string
  // record?
  params: any
  redirectedFrom?: Partial<MatcherLocationNormalized>
  meta: any
  matched: Partial<RouteRecordViewLoose>[]
  instances: Record<string, any>
}

declare global {
  namespace NodeJS {
    interface Global {
      window: JSDOM['window']
      location: JSDOM['window']['location']
      document: JSDOM['window']['document']
      before?: Function
    }
  }
}

export function createDom(options?: ConstructorOptions) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><head></head><body></body></html>`,
    {
      url: 'https://example.org/',
      referrer: 'https://example.com/',
      contentType: 'text/html',
      ...options,
    }
  )

  global.window = dom.window
  global.location = dom.window.location
  global.document = dom.window.document

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
      // @ts-ignore
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
      // @ts-ignore
      return h('div', {}, `id:${this.id};other:${this.other}`)
    },
  } as RouteComponent,
  Nested: {
    render: () => {
      const RouterView = resolveComponent('RouterView')
      return h('div', {}, [
        h('h2', {}, 'Nested'),
        RouterView ? h(RouterView as any) : [],
      ])
    },
  },
}
