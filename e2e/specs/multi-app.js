const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/multi-app'

module.exports = {
  ...bsStatus(),

  '@tags': ['history'],

  /** @type {import('nightwatch').NightwatchTest} */
  'supports multiple apps mounted at the same time': function (browser) {
    browser
      .url(baseURL)
      .assert.urlEquals(baseURL + '/')

      // mount multiple apps and expect to have one listener only
      .click('#mount1')
      .click('#mount2')
      .click('#mount3')
      .waitForElementPresent('#app-1 > *', 1000)
      .waitForElementPresent('#app-2 > *', 1000)
      .waitForElementPresent('#app-3 > *', 1000)
      .assert.containsText('#popcount', '1')
      .assert.containsText('#guardcount', '1')

      // they should all be displaying the home page
      .assert.containsText('#app-1 .home', 'Home')
      .assert.cssClassPresent(
        '#app-1 li:nth-child(1) a',
        'router-link-exact-active'
      )
      .assert.not.cssClassPresent(
        '#app-1 li:nth-child(2) a',
        'router-link-active'
      )

      .assert.containsText('#app-2 .home', 'Home')
      .assert.cssClassPresent(
        '#app-2 li:nth-child(1) a',
        'router-link-exact-active'
      )
      .assert.not.cssClassPresent(
        '#app-2 li:nth-child(2) a',
        'router-link-active'
      )

      .assert.containsText('#app-3 .home', 'Home')
      .assert.cssClassPresent(
        '#app-3 li:nth-child(1) a',
        'router-link-exact-active'
      )
      .assert.not.cssClassPresent(
        '#app-3 li:nth-child(2) a',
        'router-link-active'
      )

      // navigation on app 1
      .click('#app-1 li:nth-child(2) a')
      .assert.containsText('#guardcount', '2')
      .assert.containsText('#app-1 .user', 'User 1')
      .assert.containsText('#app-2 .user', 'User 1')
      .assert.containsText('#app-3 .user', 'User 1')

      // navigation on app 2
      .click('#app-2 li:nth-child(3) a')
      .assert.containsText('#guardcount', '3')
      .assert.containsText('#app-1 .user', 'User 2')
      .assert.containsText('#app-2 .user', 'User 2')
      .assert.containsText('#app-3 .user', 'User 2')

      // should trigger the guard only once
      .back()
      .assert.containsText('#guardcount', '4')

      // unmounting apps should pause guards
      // start by navigating 3 times
      .click('#app-1 li:nth-child(1) a')
      .click('#app-1 li:nth-child(2) a')
      .click('#app-1 li:nth-child(1) a')
      .assert.containsText('#guardcount', '7')
      .click('#unmount1')
      .click('#unmount2')
      .assert.containsText('#guardcount', '7')
      .back()
      // one app is still mounted
      .assert.containsText('#guardcount', '8')
      .click('#unmount3')
      .back()
      .assert.containsText('#guardcount', '8')

      // mounting again should add the listeners again
      .click('#mount1')
      // the initial navigation
      .assert.containsText('#guardcount', '9')
      .click('#app-1 li:nth-child(2) a')
      .assert.containsText('#guardcount', '10')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'supports navigation guards context with multiple apps': function (browser) {
    browser
      .url(baseURL)
      .assert.urlEquals(baseURL + '/')

      // mount multiple apps and expect to have one listener only
      .click('#mount1')
      .assert.containsText('#app-1 .home', 'Home')
      // toggle multiple times
      .click('#app-1 li:nth-child(2) a')
      .assert.containsText('#part-1 .count', '0')
      .click('#app-1 li:nth-child(3) a')
      .assert.containsText('#part-1 .count', '1')
      .click('#mount2')
      .assert.containsText('#app-2 .user', 'User')
      .click('#app-1 li:nth-child(2) a')
      // first one keeps updating
      .assert.containsText('#part-1 .count', '2')
      // second app only updated once
      .assert.containsText('#part-2 .count', '1')
      .click('#mount3')
  },
}
