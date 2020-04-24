const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/encoding'

module.exports = {
  ...bsStatus(),

  '@tags': ['history', 'encoding'],

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
      .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      // check initial visit
      .url(baseURL + '/documents/%E2%82%ACuro')
      .waitForElementPresent('#app > *', 1000)
      .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      // TODO: invalid in safari, tests on those where this is valid
      // .url(baseURL + '/unicode/€uro')
      // .waitForElementPresent('#app > *', 1000)
      // navigation to unencoded value
      // depending on the browser the value will be encoded or not
      // .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      .end()
  },
}
