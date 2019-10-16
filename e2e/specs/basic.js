const bsStatus = require('../browserstack-send-status')

module.exports = {
  ...bsStatus(),

  '@tags': ['history'],

  basic(browser) {
    browser
      .url('http://localhost:8080')
      .waitForElementVisible('#app', 1000)
      // .assert.count('li', 8)

      .click('li:nth-child(2) a')
      .assert.urlEquals('http://localhost:8080/documents/%E2%82%ACuro')
      .assert.containsText('#fullPath', '/documents/%E2%82%ACuro')
      .assert.containsText('#path', '/documents/%E2%82%ACuro')
      .assert.containsText('#params', JSON.stringify({ id: '€uro' }, null, 2))

      // check initial visit
      .url('http://localhost:8080/users/2')
      .waitForElementVisible('#app', 1000)
      .assert.containsText('#params', JSON.stringify({ id: '2' }, null, 2))

      .end()
  },
}
