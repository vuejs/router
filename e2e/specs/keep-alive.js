const bsStatus = require('../browserstack-send-status')

module.exports = {
  ...bsStatus(),

  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  KeepAlive: function (browser) {
    browser
      .url('http://localhost:8080/keep-alive/')
      .waitForElementPresent('#app > *', 1000)

      .assert.containsText('#counter', '0')
      .click('#increment')
      .assert.containsText('#counter', '1')

      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo')
      .click('li:nth-child(1) a')
      .assert.containsText('#counter', '1')

      .click('li:nth-child(3) a')
      .assert.containsText('#enter-count', '1')
      .assert.containsText('#update-count', '0')
      .click('#change-query')
      .assert.containsText('#enter-count', '1')
      .assert.containsText('#update-count', '1')
      .back()
      .assert.containsText('#update-count', '2')
      .assert.containsText('#leave-count', '0')
      .back()
      .assert.containsText('#counter', '1')
      .forward()
      .assert.containsText('#enter-count', '2')
      .assert.containsText('#update-count', '2')
      .assert.containsText('#leave-count', '1')

      .end()
  },
}
