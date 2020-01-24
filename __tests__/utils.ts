import { JSDOM, ConstructorOptions } from 'jsdom'
import { NavigationGuard, RouteRecord, MatchedRouteRecord } from '../src/types'
import { h } from '@vue/runtime-core'

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
    render: () => h('div', {}, [h('h2', {}, 'Nested'), h('RouterView')]),
  },
}

/**
 * Copies and normalizes the record so it always contains an object of `components`
 *
 * @param record
 * @returns a normalized copy
 */
export function normalizeRouteRecord(
  record: Exclude<RouteRecord, { redirect: any }>
): MatchedRouteRecord {
  if ('components' in record) return { ...record }
  const { component, ...rest } = record

  return {
    ...rest,
    components: { default: component },
  }
}
