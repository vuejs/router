const bsStatus = require('../browserstack-send-status')

const baseURL = 'http://localhost:8080/hash/#'

module.exports = {
  ...bsStatus(),

  '@tags': ['hash', 'encoding'],

  /** @type {import('nightwatch').NightwatchTest} */
  'navigating to links': function (browser) {
    browser
      .url(baseURL)
      .waitForElementPresent('#app > *', 1000)
      .assert.attributeContains('li:nth-child(1) a', 'href', '/hash/#/')
      .assert.attributeContains('li:nth-child(2) a', 'href', '/hash/#/foo')
      .assert.attributeContains('li:nth-child(3) a', 'href', '/hash/#/bar')
      .assert.attributeContains('li:nth-child(4) a', 'href', '/hash/#/n/%C3%A9')
      .assert.attributeContains(
        'li:nth-child(6) a',
        'href',
        '/hash/#/unicode/%C3%A9'
      )
      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/bar')
      .assert.containsText('.view', 'Bar')
      .click('li:nth-child(2) a')
      .assert.urlEquals(baseURL + '/foo')
      .click('li:nth-child(4) a')
      .assert.urlEquals(baseURL + '/n/%C3%A9')
      .assert.containsText('#path', '/n/%C3%A9')

      // the correctly encoded version
      .click('li:nth-child(6) a')
      .assert.urlEquals(baseURL + '/unicode/%C3%A9')
      .assert.containsText('#path', '/unicode/%C3%A9')
      .assert.containsText('#param', 'é')
      // the unencoded version, no check for the url because changes based on browser
      .click('li:nth-child(5) a')
      .assert.containsText('#param', 'é')

      // regular links should not break navigation
      .click('li:nth-child(10) a')
      .assert.urlEquals(baseURL + '/foo')
      .assert.containsText('#path', '/foo')
      .assert.containsText('.view', 'Foo')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'initial navigation with search': function (browser) {
    browser
      .url('http://localhost:8080/hash/?code=auth#')
      .waitForElementPresent('#app > *', 1000)
      .assert.urlEquals('http://localhost:8080/hash/?code=auth#/')

      .url('http://localhost:8080/hash/?code=auth#/foo')
      .assert.urlEquals('http://localhost:8080/hash/?code=auth#/foo')
      // manually remove the search from the URL
      .waitForElementPresent('#app > *', 1000)
      .execute(function () {
        window.history.replaceState(history.state, '', '/hash/#/foo')
      })
      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/bar')
      .back()
      .assert.urlEquals(baseURL + '/foo')

      // with slash between the pathname and search
      .url('http://localhost:8080/hash/?code=auth#')
      .waitForElementPresent('#app > *', 1000)
      .assert.urlEquals('http://localhost:8080/hash/?code=auth#/')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'encoding on initial navigation': function (browser) {
    browser
      .url(baseURL + '/unicode/%C3%A9')
      // navigation to unencoded value
      .assert.urlEquals(baseURL + '/unicode/%C3%A9')
      .assert.containsText('#path', '/unicode/%C3%A9')
      .assert.containsText('#param', 'é')

      // TODO: invalid in safari, tests on those where this is valid
      // .url(baseURL + '/unicode/é')
      // navigation to unencoded value
      // depending on the browser the value will be encoded or not
      // .assert.containsText('#param', 'é')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'manual hash change to trigger redirect': function (browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.containsText('.view', 'home')

      .execute(function () {
        window.location.hash = '#/redirect'
      })
      .assert.containsText('.view', 'Foo')
      .assert.urlEquals(baseURL + '/foo')

      .end()
  },
}
