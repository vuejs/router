module.exports = {
  '@tags': ['no-headless'],

  transitions: function (browser) {
    const TIMEOUT = 3000

    browser
      .url('http://localhost:3000/transitions/')
      .waitForElementPresent('#app > *', 1000)

      .click('li:nth-child(2) a')
      .assert.hasClass('.view.home', 'fade-leave-active')
      .waitForElementPresent('.view.parent', TIMEOUT)
      .assert.hasClass('.view.parent', 'fade-enter-active')
      .assert.not.hasClass('.child-view.default', 'slide-left-enter-active')
      .waitForElementNotPresent('.view.parent.fade-enter-active', TIMEOUT)

      .click('li:nth-child(3) a')
      .assert.hasClass('.child-view.default', 'slide-left-leave-active')
      .assert.hasClass('.child-view.foo', 'slide-left-enter-active')
      .waitForElementNotPresent('.child-view.default', TIMEOUT)

      .click('li:nth-child(4) a')
      .assert.hasClass('.child-view.foo', 'slide-left-leave-active')
      .assert.hasClass('.child-view.bar', 'slide-left-enter-active')
      .waitForElementNotPresent('.child-view.foo', TIMEOUT)

      .click('li:nth-child(2) a')
      .assert.hasClass('.child-view.bar', 'slide-right-leave-active')
      .assert.hasClass('.child-view.default', 'slide-right-enter-active')
      .waitForElementNotPresent('.child-view.bar', TIMEOUT)

      .click('li:nth-child(1) a')
      .assert.hasClass('.view.parent', 'fade-leave-active')
      .waitForElementPresent('.view.home', TIMEOUT)
      .assert.hasClass('.view.home', 'fade-enter-active')
      .waitForElementNotPresent('.view.home.fade-enter-active', TIMEOUT)

      .click('li:nth-child(5) a')
      .assert.hasClass('.view.home', 'fade-leave-active')
      .waitForElementNotPresent('.view.home', TIMEOUT)
      .click('li:nth-child(2) a')
      .assert.hasClass('.view.parent', 'fade-enter-active')

      .end()
  },

  'out in transitions': function (browser) {
    browser
      .url('http://localhost:3000/transitions/')
      .waitForElementPresent('#app > *', 1000)
      .click('#toggle-transition')

      .click('li:nth-child(7) a')
      .assert.textContains('.nested-view', 'foo')
      .click('li:nth-child(1) a')
      .waitForElementPresent('.view.home', 1000)
      .click('li:nth-child(7) a')
      .assert.textContains('.nested-view', 'foo')

      .end()
  },
}
