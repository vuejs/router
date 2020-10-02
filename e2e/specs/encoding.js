const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/encoding'

const rawText = ' !"#$&\'()*+,/:;<=>?@[]^`{|}'

module.exports = {
  ...bsStatus(),

  '@tags': ['history', 'encoding', 'browserstack'],

  /** @type {import('nightwatch').NightwatchTest} */
  'encodes values': function (browser) {
    browser
      .url(baseURL)
      .assert.urlEquals(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)

      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/documents/%E2%82%ACuro')
      .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#p-id', '"€uro"')

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
    browser.click('li:nth-child(7) a').waitForElementPresent('#app > *', 1000)
    browser.expect.element('#p-id').text.equals(`"${rawText}"`)
    browser.expect
      .element('#query')
      .text.equals(JSON.stringify({ 'a=': rawText }, null, 2))
    browser.expect.element('#hash').text.equals('#' + rawText)

    // check initial visit
    browser
      .url(baseURL + '/documents/%E2%82%ACuro')
      .waitForElementPresent('#app > *', 1000)
      // .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      // .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#p-id', '"€uro"')

      // TODO: invalid in safari, tests on those where this is valid
      // .url(baseURL + '/unicode/€uro')
      // .waitForElementPresent('#app > *', 1000)
      // navigation to unencoded value
      // depending on the browser the value will be encoded or not
      // .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      .end()
  },
}
