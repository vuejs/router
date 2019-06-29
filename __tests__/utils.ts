import { JSDOM, ConstructorOptions } from 'jsdom'
import { NavigationGuard } from '../src/types'
import { Component } from 'vue'

export { HistoryMock } from './HistoryMock'

export const tick = () => new Promise(resolve => process.nextTick(resolve))

export const NAVIGATION_TYPES = ['push', 'replace']

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

  // @ts-ignore
  global.window = dom.window
  // @ts-ignore
  global.location = dom.window.location
  // @ts-ignore
  global.document = dom.window.document

  return dom
}

export const noGuard: NavigationGuard = (to, from, next) => {
  next()
}

export const components: Record<string, Component> = {
  Home: { render: h => h('div', {}, 'Home') },
  Foo: { render: h => h('div', {}, 'Foo') },
  Bar: { render: h => h('div', {}, 'Bar') },
}

// allow using a .jest modifider to skip some tests on mocha
// specifically, skip component tests as they are a pain to correctly
// adapt to mocha
// @ts-ignore
export const isMocha = () => typeof global.before === 'function'
