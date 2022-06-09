module.exports = {
  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  KeepAlive: function (browser) {
    browser
      .url('http://localhost:3000/keep-alive/')
      .waitForElementPresent('#app > *', 1000)

      .assert.textContains('#counter', '0')
      .click('#increment')
      .assert.textContains('#counter', '1')

      .click('li:nth-child(2) a')
      .assert.textContains('.view', 'foo')
      .click('li:nth-child(1) a')
      .assert.textContains('#counter', '1')

      .click('li:nth-child(3) a')
      .assert.textContains('#enter-count', '1')
      .assert.textContains('#update-count', '0')
      .click('#change-query')
      .assert.textContains('#enter-count', '1')
      .assert.textContains('#update-count', '1')
      .back()
      .assert.textContains('#update-count', '2')
      .assert.textContains('#leave-count', '0')
      .back()
      .assert.textContains('#counter', '1')
      .forward()
      .assert.textContains('#enter-count', '2')
      .assert.textContains('#update-count', '2')
      .assert.textContains('#leave-count', '1')

      .end()
  },
}
