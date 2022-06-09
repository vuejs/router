// const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:3000/encoding'

const rawText = ' !"#$&\'()*+,/:;<=>?@[]^`{|}'

const TIMEOUT = 2000

module.exports = {
  // ...bsStatus(),

  '@tags': ['history', 'encoding', 'browserstack'],

  /** @type {import('nightwatch').NightwatchTest} */
  'encodes values'(browser) {
    browser
      .url(baseURL + '/')
      .assert.urlEquals(baseURL + '/')
      .waitForElementPresent('#app > *', TIMEOUT)

      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/documents/%E2%82%ACuro')
      .assert.textContains('#fullPath', '/documents/%E2%82%ACuro')
      .assert.textContains('#path', '/documents/%E2%82%ACuro')
      .assert.textContains('#p-id', '"€uro"')

      // full encoding test
      .click('li:nth-child(8) a')
    browser.expect.element('#p-id').text.equals(`"${rawText}"`)
    browser.expect
      .element('#query')
      .text.equals(JSON.stringify({ 'a=': rawText }, null, 2))
    browser.expect.element('#hash').text.equals('#' + rawText)

    // link by the browser with minimal encoding
    // browsers will encode it differently but the resulted decoded values
    // should be consistent across browsers
    browser
      .click('li:nth-child(7) a')
      .waitForElementPresent('#app > *', TIMEOUT)
    browser.expect.element('#p-id').text.equals(`"${rawText}"`)
    browser.expect
      .element('#query')
      .text.equals(JSON.stringify({ 'a=': rawText }, null, 2))
    browser.expect.element('#hash').text.equals('#' + rawText)

    // check initial visit
    browser
      .url(baseURL + '/documents/%E2%82%ACuro')
      .waitForElementPresent('#app > *', TIMEOUT)
      // .assert.textContains('#fullPath', '/documents/%E2%82%ACuro')
      // .assert.textContains('#path', '/documents/%E2%82%ACuro')
      .assert.textContains('#p-id', '"€uro"')

      // TODO: invalid in safari, tests on those where this is valid
      // .url(baseURL + '/unicode/€uro')
      // .waitForElementPresent('#app > *', TIMEOUT)
      // navigation to unencoded value
      // depending on the browser the value will be encoded or not
      // .assert.textContains('#params', JSON.stringify({ id: '€uro' }, null, 2))

      .end()
  },
}
