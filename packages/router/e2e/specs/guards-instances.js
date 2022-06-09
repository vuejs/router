function testCase(browser, name) {
  return browser
    .click('li:nth-child(2) a')
    .assert.textContains(`#${name} .enterCbs`, '1')
    .assert.textContains(`#${name} .update`, '0')
    .assert.textContains(`#${name} .leave`, '0')
    .click('li:nth-child(3) a')
    .assert.textContains(`#${name} .enterCbs`, '2')
    .assert.textContains(`#${name} .update`, '0')
    .assert.textContains(`#${name} .leave`, '1')
    .click('li:nth-child(4) a')
    .assert.textContains(`#${name} .enterCbs`, '2')
    .assert.textContains(`#${name} .update`, '1')
    .assert.textContains(`#${name} .leave`, '1')
    .click('li:nth-child(5) a')
    .assert.textContains(`#${name} .enterCbs`, '2')
    .assert.textContains(`#${name} .update`, '2')
    .assert.textContains(`#${name} .leave`, '1')
    .click('li:nth-child(2) a')
    .assert.textContains(`#${name} .enterCbs`, '3')
    .assert.textContains(`#${name} .update`, '2')
    .assert.textContains(`#${name} .leave`, '2')
    .expect.element('#logs')
    .text.to.equal(
      [
        `${name}: enter / - /foo`,
        `${name}: leave /foo - /f/1`,
        `${name}: setup:leave /foo - /f/1`,
        `${name}: enter /foo - /f/1`,
        `${name}: update /f/1 - /f/2`,
        `${name}: setup:update /f/1 - /f/2`,
        `${name}: update /f/2 - /f/2`,
        `${name}: setup:update /f/2 - /f/2`,
        `${name}: leave /f/2 - /foo`,
        `${name}: setup:leave /f/2 - /foo`,
        `${name}: enter /f/2 - /foo`,
      ].join('\n')
    )
}

module.exports = {
  '@tags': [],

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances': function (browser) {
    const name = 'Foo'
    browser
      .url('http://localhost:3000/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-normal')

    testCase(browser, name)

    browser
      .click('li:nth-child(1) a')
      // the enters are reset when leaving a reused component
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '1')

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances transition': function (browser) {
    browser
      .url('http://localhost:3000/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-transition')

    testCase(browser, 'Foo')

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keep alive': function (browser) {
    const name = 'Foo'
    browser
      .url('http://localhost:3000/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keepalive')

    testCase(browser, name)

    browser
      .click('li:nth-child(1) a')
      // keep alive keeps the correct instance
      .click('li:nth-child(2) a')
      .expect.element(`#${name} .enterCbs`)
      .text.equals('4')
    browser
      .click('li:nth-child(1) a')
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '5')
      .click('li:nth-child(3) a')
      .assert.textContains(`#${name} .enterCbs`, '6')
      // leave the update view and enter it again
      .click('li:nth-child(1) a')
      .click('li:nth-child(3) a')
      .click('#resetLogs')
      .click('li:nth-child(4) a')
      .click('li:nth-child(1) a')
      .expect.element('#logs')
      .text.to.equal(
        [
          `${name}: update /f/1 - /f/2`,
          `${name}: setup:update /f/1 - /f/2`,
          `${name}: leave /f/2 - /`,
          `${name}: setup:leave /f/2 - /`,
        ].join('\n')
      )

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keyed': function (browser) {
    const name = 'Foo'
    browser
      .url('http://localhost:3000/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keyed')

    testCase(browser, name)

    browser
      .click('li:nth-child(5) a')
      // the query is used as a key resetting the enter count
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '0')
      // changing both the route and mounting the component
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '1')
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '1')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '1')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .click('#resetLogs')
      .click('li:nth-child(7) a')
      .assert.textContains(`#${name} .enterCbs`, '0')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .expect.element('#logs')
      .text.to.equal(
        [
          // to force new lines formatting
          `${name}: update /f/2 - /f/2`,
          `${name}: setup:update /f/2 - /f/2`,
        ].join('\n')
      )
    browser
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '0')

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards instances keepalive keyed': function (browser) {
    const name = 'Foo'
    browser
      .url('http://localhost:3000/guards-instances/')
      .waitForElementPresent('#app > *', 1000)

      .click('#test-keepalivekeyed')

    testCase(browser, name)

    browser
      .click('li:nth-child(1) a')
      // keep alive keeps the correct instance
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '4')
      .click('li:nth-child(1) a')
      .click('li:nth-child(2) a')
      .assert.textContains(`#${name} .enterCbs`, '5')
      .click('li:nth-child(3) a')
      .assert.textContains(`#${name} .enterCbs`, '6')

      .click('li:nth-child(5) a')
      // the query is used as a key resetting the enter count
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '0')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .click('li:nth-child(1) a')
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '1')
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '1')
      .click('li:nth-child(5) a')
      .assert.textContains(`#${name} .enterCbs`, '6')
      // on reused instance
      .click('li:nth-child(2) a')
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '2')
      .assert.textContains(`#${name} .update`, '1')
      .assert.textContains(`#${name} .leave`, '1')
      .click('#resetLogs')
      .click('li:nth-child(7) a')
      .assert.textContains(`#${name} .enterCbs`, '0')
      // the previous instance was updated but not this one
      .assert.textContains(`#${name} .update`, '0')
      .assert.textContains(`#${name} .leave`, '0')
      .expect.element('#logs')
      // should only trigger active guards
      .text.to.equal(
        [
          // foo
          `${name}: update /f/2 - /f/2`,
          `${name}: setup:update /f/2 - /f/2`,
        ].join('\n')
      )
    browser
      .click('li:nth-child(6) a')
      .assert.textContains(`#${name} .enterCbs`, '2')
      .assert.textContains(`#${name} .update`, '2')
      .assert.textContains(`#${name} .leave`, '1')
      .expect.element('#logs')
      .text.to.equal(
        [
          `${name}: update /f/2 - /f/2`,
          `${name}: setup:update /f/2 - /f/2`,
          `${name}: update /f/2 - /f/2`,
          `${name}: setup:update /f/2 - /f/2`,
        ].join('\n')
      )

    browser.end()
  },

  /** @type {import('nightwatch').NightwatchTest} */
  'guards + instances + named views': function (browser) {
    browser
      .url('http://localhost:3000/guards-instances/named-one')
      .waitForElementPresent('#app > *', 1000)

    browser
      .click('li:nth-child(1) a')
      .expect.element('#logs')
      .text.to.equal(
        [
          `One: enter / - /named-one`,
          `Aux: enter / - /named-one`,
          `One: leave /named-one - /`,
          `Aux: leave /named-one - /`,
          `One: setup:leave /named-one - /`,
          `Aux: setup:leave /named-one - /`,
        ].join('\n')
      )

    browser
      .click('li:nth-child(9) a')
      .click('#resetLogs')
      .click('li:nth-child(10) a')
      .expect.element('#logs')
      .text.to.equal(
        [
          `One: leave /named-one - /named-two`,
          `Aux: leave /named-one - /named-two`,
          `One: setup:leave /named-one - /named-two`,
          `Aux: setup:leave /named-one - /named-two`,
          `Two: enter /named-one - /named-two`,
          `Aux: enter /named-one - /named-two`,
        ].join('\n')
      )

    browser.end()
  },
}
