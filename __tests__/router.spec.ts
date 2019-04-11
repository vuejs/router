import { HTML5History } from '../src/history/html5'
import { Router } from '../src/router'
import { JSDOM } from 'jsdom'

describe('Router', () => {
  beforeAll(() => {
    // TODO: move to utils for tests that need DOM
    const dom = new JSDOM(
      `<!DOCTYPE html><html><head></head><body></body></html>`,
      {
        url: 'https://example.org/',
        referrer: 'https://example.com/',
        contentType: 'text/html',
      }
    )

    // @ts-ignore
    global.window = dom.window
  })

  it('can be instantiated', () => {
    const history = new HTML5History()
    const router = new Router({ history, routes: [] })
    expect(router.currentRoute).toEqual({
      fullPath: '/',
      hash: '',
      params: {},
      path: '/',
      query: {},
    })
  })
})
