const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/encoding'

module.exports = {
  ...bsStatus(),

  '@tags': ['history', 'encoding'],

  /** @type {import('nightwatch').NightwatchTest} */
  basic(browser) {
    browser
      .url(baseURL)
      // TODO: move this test to a different spec
      .assert.urlEquals(baseURL + '/')
      .waitForElementVisible('#app', 1000)

      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/documents/%E2%82%ACuro')
      .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      // check initial visit
      .url(baseURL + '/documents/%E2%82%ACuro')
      .waitForElementVisible('#app', 1000)
      .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      .end()
  },
}
