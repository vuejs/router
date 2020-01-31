import { JSDOM, ConstructorOptions } from 'jsdom'
import { NavigationGuard, RouteRecord } from '../src/types'
import { h, resolveComponent } from '@vue/runtime-core'
import { RouteRecordMatched } from '../src/matcher/types'

export const tick = (time?: number) =>
  new Promise(resolve => {
    if (time) setTimeout(resolve, time)
    else process.nextTick(resolve)
  })

export type NAVIGATION_METHOD = 'push' | 'replace'
export const NAVIGATION_TYPES: NAVIGATION_METHOD[] = ['push', 'replace']

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

const DEFAULT_COMMON_RECORD_PROPERTIES = {
  beforeEnter: undefined,
  leaveGuards: [],
  meta: undefined,
}

/**
 * Adds missing properties
 *
 * @param record
 * @returns a normalized copy
 */
export function normalizeRouteRecord(
  // cannot be a redirect record
  record: Exclude<RouteRecord, { redirect: any }>
): RouteRecordMatched {
  if ('components' in record)
    return {
      ...DEFAULT_COMMON_RECORD_PROPERTIES,
      ...record,
    }

  const { component, ...rest } = record

  return {
    ...DEFAULT_COMMON_RECORD_PROPERTIES,
    ...rest,
    components: { default: component },
  }
}
