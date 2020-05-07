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
      .assert.containsText('#app-1 .user', 'User 1')
      .assert.containsText('#app-2 .user', 'User 1')
      .assert.containsText('#app-3 .user', 'User 1')

      // navigation on app 2
      .click('#app-2 li:nth-child(3) a')
      .assert.containsText('#app-1 .user', 'User 2')
      .assert.containsText('#app-2 .user', 'User 2')
      .assert.containsText('#app-3 .user', 'User 2')

      // unmounting apps should end up removing the popstate listener
      // .click('#unmount1')
      // .click('#unmount2')
      // .click('#unmount3')
      // TODO: we need a way to hook into unmount
      // .assert.containsText('#popcount', '0')

      .end()
  },
}
