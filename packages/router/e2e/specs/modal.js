const baseURL = 'http://localhost:3000/modal'

module.exports = {
  '@tags': ['history'],

  /** @type {import('nightwatch').NightwatchTest} */
  'changes the url': function (browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.textContains('h1', 'Home')
      .assert.not.visible('dialog')
      .assert.textContains('.child', 'child')

      .click('li:nth-child(2) button')
      .assert.urlEquals(baseURL + '/users/1')
      .assert.visible('dialog')
      .assert.textContains('dialog', 'User #1')
      .assert.textContains('.child', 'child')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'can close and reopen the modal through history'(browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.textContains('h1', 'Home')

      .click('li:nth-child(2) button')
      .assert.visible('dialog')
      .back()
      .assert.not.visible('dialog')
      .assert.urlEquals(baseURL + '/')
      .forward()
      .assert.visible('dialog')
      .assert.urlEquals(baseURL + '/users/1')
      .back()
      .assert.not.visible('dialog')
      .assert.urlEquals(baseURL + '/')
      .forward()
      .assert.visible('dialog')
      .assert.urlEquals(baseURL + '/users/1')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'can keep the modal when reloading'(browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.textContains('h1', 'Home')

      .click('li:nth-child(2) button')
      .assert.visible('dialog')
      .refresh()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.textContains('h1', 'Home')
      .assert.visible('dialog')
      .back()
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .assert.not.visible('dialog')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'can pass through the modal and then back'(browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.textContains('h1', 'Home')
      .assert.not.visible('dialog')

      .click('li:nth-child(2) a')
      .assert.urlEquals(baseURL + '/users/1')
      .assert.textContains('h1', 'User #1')
      .click('#app a')
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .click('li:nth-child(3) a')
      .assert.urlEquals(baseURL + '/users/2')
      .assert.textContains('h1', 'User #2')
      .click('#app a')
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .click('li:nth-child(2) button')
      .assert.urlEquals(baseURL + '/users/1')
      .assert.visible('dialog')
      .back()
      .assert.not.visible('dialog')
      .assert.urlEquals(baseURL + '/')
      .back()
      .assert.urlEquals(baseURL + '/users/2')
      .assert.textContains('h1', 'User #2')
      .back()
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .back()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.textContains('h1', 'User #1')
      .back()
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .forward()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.textContains('h1', 'User #1')
      .forward()
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .forward()
      .assert.urlEquals(baseURL + '/users/2')
      .assert.textContains('h1', 'User #2')
      .forward()
      .assert.urlEquals(baseURL + '/')
      .assert.textContains('h1', 'Home')
      .assert.not.visible('dialog')
      .assert.urlEquals(baseURL + '/')
      .forward()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.visible('dialog')

      .end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'can navigate away from the modal then come back'(browser) {
    browser
      .url(baseURL + '/')
      .waitForElementPresent('#app > *', 1000)
      .assert.textContains('h1', 'Home')

      .click('li:nth-child(2) button')
      .assert.visible('dialog')
      .click('dialog a')
      .assert.urlEquals(baseURL + '/about')
      .assert.textContains('h1', 'About')
      .back()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.visible('dialog')
      .forward()
      .assert.urlEquals(baseURL + '/about')
      .assert.textContains('h1', 'About')
      .back()
      .assert.urlEquals(baseURL + '/users/1')
      .assert.visible('dialog')

      .end()
  },
}
