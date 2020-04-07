const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/navigation-guards'

module.exports = {
  ...bsStatus(),

  /** @type {import('nightwatch').NightwatchTest} */
  'blocks leaving navigation with onBeforeRouteLeave': function(browser) {
    browser
      .url(baseURL)
      .assert.urlEquals(baseURL + '/')
      .waitForElementVisible('#app', 1000)
      .click('li:nth-child(2) a')
      .assert.urlEquals(baseURL + '/cant-leave')
      .assert.containsText('#tries', '0 times')
      .click('li:nth-child(1) a')
      .dismissAlert()
      .waitFor(100)
      .assert.urlEquals(baseURL + '/cant-leave')
      .assert.containsText('#tries', '1 times')
      .click('li:nth-child(1) a')
      .dismissAlert()
      .waitFor(100)
      .assert.urlEquals(baseURL + '/cant-leave')
      .assert.containsText('#tries', '2 times')
      .click('li:nth-child(1) a')
      .acceptAlert()
      .waitFor(100)
      .assert.urlEquals(baseURL + '/')

      .end()
  },
}
