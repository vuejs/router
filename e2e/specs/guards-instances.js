const bsStatus = require('../browserstack-send-status')

module.exports = {
  ...bsStatus(),

  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  GuardsInstances: function (browser) {
    browser
      .url('http://localhost:8080/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 1')
      .click('li:nth-child(3) a')
      .assert.containsText('.view', 'foo 2')
      .click('li:nth-child(4) a')
      .assert.containsText('.view', 'foo 2')
      .click('li:nth-child(5) a')
      .assert.containsText('.view', 'foo 2')
      .click('li:nth-child(2) a')
      .assert.containsText('.view', 'foo 3')
      .assert.containsText(
        '#logs',
        [
          'enter / - /foo',
          'leave /foo - /f/1',
          'enter /foo - /f/1',
          'update /f/1 - /f/2',
          'update /f/2 - /f/2',
          'leave /f/2 - /foo',
          'enter /f/2 - /foo',
        ].join('\n')
      )

      .end()
  },
}
