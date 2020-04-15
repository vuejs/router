const bsStatus = require('../browserstack-send-status')

module.exports = {
  ...bsStatus(),

  '@tags': ['history'],
  // NOTE: position is not saved when navigating back using browser buttons and
  // therefore navigating forward does not restore position unless we use native
  // browser behavior `window.scrollRestoration = 'auto'`

  'scroll behavior': function(browser) {
    const TIMEOUT = 2000

    browser
      .url('http://localhost:8080/scroll-behavior/')
      .waitForElementPresent('#app > *', 1000)
      .assert.count('li a', 6)
      .assert.containsText('.view', 'home')

      .execute(function() {
        window.scrollTo(0, 100)
      })
      .click('li:nth-child(2) a')
      .waitForElementPresent('.view.foo', TIMEOUT)
      .assert.containsText('.view', 'foo')
      .execute(function() {
        window.scrollTo(0, 200)
        window.history.back()
      })
      .waitForElementPresent('.view.home', TIMEOUT)
      .assert.containsText('.view', 'home')
      .assert.evaluate(
        function() {
          return window.pageYOffset === 100
        },
        null,
        'restore scroll position on back'
      )

      // with auto scroll restoration. This allows the forward to work even
      // though no scroll position is saved by the router. The problem comes
      // from the timing of popstate events: when they happen the history.state
      // entry is the new location we are trying to navigate to, which means we
      // cannot save the scroll position before navigating away unless we undo
      // the navigation which is not always possible and quite hacky. We could
      // instead save the forwardScroll/backwardScroll on the current entry and
      // restore it on popstate by reading the RouterHistory.state property,
      // which contains the state before popstate, so it contains the previous
      // state. This, however is only a partial solution, as it would only work
      // in simple situations (`abs(distance) === 1`). If the user uses
      // `history.go(-3)`, then we won't have access to the scroll position, so
      // instead we need to store scroll positions in a different place instead
      // of history.state
      // https://developers.google.com/web/updates/2015/09/history-api-scroll-restoration
      .execute(function() {
        window.scrollTo(0, 100)
        history.scrollRestoration = 'auto'
      })
      .click('li:nth-child(2) a')
      .waitForElementPresent('.view.foo', TIMEOUT)
      .assert.containsText('.view', 'foo')
      .execute(function() {
        window.scrollTo(0, 200)
        window.history.back()
      })
      .waitForElementPresent('.view.home', TIMEOUT)
      .assert.containsText('.view', 'home')
      .assert.evaluate(
        function() {
          return window.pageYOffset === 100
        },
        null,
        'restore scroll position on back with scrollRestoration set to auto'
      )

      // scroll on a popped entry
      .execute(function() {
        window.scrollTo(0, 50)
        window.history.forward()
      })
      .waitForElementPresent('.view.foo', TIMEOUT)
      .assert.containsText('.view', 'foo')
      .assert.evaluate(
        function() {
          return window.pageYOffset === 200
        },
        null,
        'restore scroll position on forward'
      )
      .execute(function() {
        history.scrollRestoration = 'manual'
      })

      .execute(function() {
        window.history.back()
      })
      .waitForElementPresent('.view.home', TIMEOUT)
      .assert.containsText('.view', 'home')
      .assert.evaluate(
        function() {
          return window.pageYOffset === 50
        },
        null,
        'restore scroll position on back again'
      )

      .click('li:nth-child(3) a')
      .waitForElementPresent('.view.bar', TIMEOUT)
      .assert.evaluate(
        function() {
          return window.pageYOffset === 0
        },
        null,
        'scroll to top on new entry'
      )

      .click('li:nth-child(4) a')
      .assert.evaluate(
        function() {
          return (
            document.getElementById('anchor').getBoundingClientRect().top < 1
          )
        },
        null,
        'scroll to anchor'
      )

      .execute(function() {
        document.querySelector('li:nth-child(5) a').click()
      })
      .assert.evaluate(
        function() {
          return (
            document.getElementById('anchor2').getBoundingClientRect().top < 101
          )
        },
        null,
        'scroll to anchor with offset'
      )
      .execute(function() {
        document.querySelector('li:nth-child(6) a').click()
      })
      .assert.evaluate(
        function() {
          return (
            document.getElementById('1number').getBoundingClientRect().top < 1
          )
        },
        null,
        'scroll to anchor that starts with number'
      )
      .end()
  },
}
