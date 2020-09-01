const bsStatus = require('../browserstack-send-status')

function testCase(browser) {
  return browser
    .click('li:nth-child(2) a')
    .assert.containsText('.view', 'foo 1')
    .click('li:nth-child(3) a')
    .assert.containsText('.view', 'foo 1')
    .click('li:nth-child(4) a')
    .assert.containsText('.view', 'foo 1')
    .click('li:nth-child(5) a')
    .assert.containsText('.view', 'foo 1')
    .click('li:nth-child(2) a')
    .assert.containsText('.view', 'foo')
    .assert.containsText(
      '#logs',
      [
        'enter / - /foo',
        'leave /foo - /f/1',
        'setup:leave /foo - /f/1',
        'enter /foo - /f/1',
        'update /f/1 - /f/2',
        'setup:update /f/1 - /f/2',
        'update /f/2 - /f/2',
        'setup:update /f/2 - /f/2',
        'leave /f/2 - /foo',
        'setup:leave /f/2 - /foo',
        'enter /f/2 - /foo',
      ].join('\n')
    )
}

module.exports = {
  ...bsStatus(),

  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances': function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-normal')

    testCase(browser)

    browser
      .click('li:nth-child(1) a')
      // the enters are reset when leaving a reused component
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 1')

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keep alive': function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keepalive')

    testCase(browser)

    browser
      .click('li:nth-child(1) a')
      // keep alive keeps the correct instance
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 3')
      .click('li:nth-child(1) a')
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 4')
      .click('li:nth-child(3) a')
      .assert.containsText('.view', 'foo 2')
      // leave the update view and enter it again
      .click('li:nth-child(1) a')
      .click('li:nth-child(3) a')
      .click('#resetLogs')
      .click('li:nth-child(4) a')
      .click('li:nth-child(1) a')
      .assert.containsText(
        '#logs',
        [
          'update /f/1 - /f/2',
          'setup:update /f/1 - /f/2',
          'leave /f/2 - /',
          'setup:leave /f/2 - /',
        ].join('\n')
      )

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances transition': function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-transition')

    testCase(browser)

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keyed': function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keyed')

    testCase(browser)

    browser
      .click('li:nth-child(5) a')
      // the query is used as a key resetting the enter count
      .click('li:nth-child(6) a')
      .assert.containsText('.view', 'foo 0')
      // changing both the route and mounting the component
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 1')
      .click('li:nth-child(6) a')
      .assert.containsText('.view', 'foo 1')
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 1')

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keepalive keyed': function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keepalivekeyed')

    testCase(browser)

    browser
      .click('li:nth-child(1) a')
      // keep alive keeps the correct instance
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 3')
      .click('li:nth-child(1) a')
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 4')
      .click('li:nth-child(3) a')
      .assert.containsText('.view', 'foo 2')

      .click('li:nth-child(5) a')
      // the query is used as a key resetting the enter count
      .click('li:nth-child(6) a')
      .assert.containsText('.view', 'foo 0')
      .click('li:nth-child(1) a')
      .click('li:nth-child(6) a')
      .assert.containsText('.view', 'foo 1')
      .click('li:nth-child(5) a')
      .assert.containsText('.view', 'foo 2')

    browser.end()
  },
}
