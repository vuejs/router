const baseURL = 'http://localhost:3000/multi-app'

module.exports = {
  '@tags': ['history'],

  /** @type {import('nightwatch').NightwatchTest} */
  'supports multiple apps mounted at the same time': function (browser) {
    browser
      .url(baseURL + '/')
      .assert.urlEquals(baseURL + '/')

      // mount multiple apps and expect to have one listener only
      .click('#mount1')
      .click('#mount2')
      .click('#mount3')
      .waitForElementPresent('#app-1 > *', 1000)
      .waitForElementPresent('#app-2 > *', 1000)
      .waitForElementPresent('#app-3 > *', 1000)
      .assert.textContains('#popcount', '1')
      .assert.textContains('#guardcount', '1')

      // they should all be displaying the home page
      .assert.textContains('#app-1 .home', 'Home')
      .assert.hasClass('#app-1 li:nth-child(1) a', 'router-link-exact-active')
      .assert.not.hasClass('#app-1 li:nth-child(2) a', 'router-link-active')

      .assert.textContains('#app-2 .home', 'Home')
      .assert.hasClass('#app-2 li:nth-child(1) a', 'router-link-exact-active')
      .assert.not.hasClass('#app-2 li:nth-child(2) a', 'router-link-active')

      .assert.textContains('#app-3 .home', 'Home')
      .assert.hasClass('#app-3 li:nth-child(1) a', 'router-link-exact-active')
      .assert.not.hasClass('#app-3 li:nth-child(2) a', 'router-link-active')

      // navigation on app 1
      .click('#app-1 li:nth-child(2) a')
      .assert.textContains('#guardcount', '2')
      .assert.textContains('#app-1 .user', 'User 1')
      .assert.textContains('#app-2 .user', 'User 1')
      .assert.textContains('#app-3 .user', 'User 1')

      // navigation on app 2
      .click('#app-2 li:nth-child(3) a')
      .assert.textContains('#guardcount', '3')
      .assert.textContains('#app-1 .user', 'User 2')
      .assert.textContains('#app-2 .user', 'User 2')
      .assert.textContains('#app-3 .user', 'User 2')

      // should trigger the guard only once
      .back()
      .assert.textContains('#guardcount', '4')

      // unmounting apps should pause guards
      // start by navigating 3 times
      .click('#app-1 li:nth-child(1) a')
      .click('#app-1 li:nth-child(2) a')
      .click('#app-1 li:nth-child(1) a')
      .assert.textContains('#guardcount', '7')
      .click('#unmount1')
      .click('#unmount2')
      .assert.textContains('#guardcount', '7')
      .back()
      // one app is still mounted
      .assert.textContains('#guardcount', '8')
      .click('#unmount3')
      .back()
      .assert.textContains('#guardcount', '8')

      // mounting again should add the listeners again
      .click('#mount1')
      // the initial navigation
      .assert.textContains('#guardcount', '9')
      .click('#app-1 li:nth-child(2) a')
      .assert.textContains('#guardcount', '10')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'supports navigation guards context with multiple apps': function (browser) {
    browser
      .url(baseURL + '/')
      .assert.urlEquals(baseURL + '/')

      // mount multiple apps and expect to have one listener only
      .click('#mount1')
      .assert.textContains('#app-1 .home', 'Home')
      // toggle multiple times
      .click('#app-1 li:nth-child(2) a')
      .assert.textContains('#part-1 .count', '0')
      .click('#app-1 li:nth-child(3) a')
      .assert.textContains('#part-1 .count', '1')
      .click('#mount2')
      .assert.textContains('#app-2 .user', 'User')
      .click('#app-1 li:nth-child(2) a')
      // first one keeps updating
      .assert.textContains('#part-1 .count', '2')
      // second app only updated once
      .assert.textContains('#part-2 .count', '1')
      .click('#mount3')
  },
}
