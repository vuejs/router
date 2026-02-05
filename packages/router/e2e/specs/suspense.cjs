module.exports = {
  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  'suspense with guards': function (browser) {
    browser
      .url('http://localhost:3000/suspense/foo')
      .waitForElementPresent('#app > *', 1000)

    browser
      .click('li:nth-child(2) a')
      .waitForElementPresent('#Foo', 1000)
      .click('li:nth-child(4) a')
      .click('li:nth-child(3) a')
      .waitForElementPresent('#FooAsync', 1000)
      .click('li:nth-child(4) a')
      .click('li:nth-child(2) a')
      .waitForElementPresent('#Foo', 1000)
      .click('li:nth-child(4) a')
      .click('li:nth-child(1) a')
      .expect.element('#logs')
      .text.to.equal(
        [
          `Foo: setup:update /foo - /foo?n=1`,
          `Foo: setup:leave /foo?n=1 - /foo-async`,
          `FooAsync: setup:update /foo-async - /foo-async?n=1`,
          `FooAsync: setup:leave /foo-async?n=1 - /foo`,
          `Foo: setup:update /foo - /foo?n=1`,
          `Foo: setup:leave /foo?n=1 - /`,
        ].join('\n')
      )

    browser.end()
  },
}
