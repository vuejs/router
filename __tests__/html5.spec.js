// @ts-check
require('./helper')
const expect = require('expect')
const { HTML5History } = require('../src/history/html5')
const { JSDOM } = require('jsdom')

describe('History HTMl5', () => {
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
    expect(history.location).toBe('/')
  })
})
