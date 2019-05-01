import { JSDOM, ConstructorOptions } from 'jsdom'

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

  return dom
}

export const components = {
  Home: { template: `<div>Home</div>` },
  Foo: { template: `<div>Foo</div>` },
  Bar: { template: `<div>Bar</div>` },
}
