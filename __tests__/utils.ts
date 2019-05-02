import { JSDOM, ConstructorOptions } from 'jsdom'
import {} from '../src/types'
import { NavigationGuard } from '../../vue-router/types'

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

export const components = {
  Home: { template: `<div>Home</div>` },
  Foo: { template: `<div>Foo</div>` },
  Bar: { template: `<div>Bar</div>` },
}
