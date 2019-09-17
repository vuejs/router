'use strict'
// make tests compatible with mocha so we can write using jest syntax
if (typeof global !== 'undefined' && typeof global.beforeAll === 'undefined') {
  global.beforeAll = global.before
  global.afterAll = global.after

  const mocks = require('jest-mock')
  global.jest = mocks

  const INITIAL_WS_RE = /^\s+/

  const expect = require('expect')
  // monkey patch jest snapshots
  expect.extend({
    toMatchInlineSnapshot(received, snapshot) {
      const text =
        typeof received === 'string'
          ? JSON.stringify(received)
          : `[${received.toString()}]`

      const match = INITIAL_WS_RE.exec(snapshot)
      let expected = snapshot
      if (match) {
        // remove the initial linefeed
        const pad = match[0].replace(/^\n/, '')
        expected = snapshot
          .split('\n')
          .map(chunk => chunk.slice(pad.length))
          .join('\n')
          .trim()
      }
      const pass = text === expected
      return {
        pass,
        message: () =>
          `Snapshot not maching.\nExpected:\n${expected}\nReceived:\n${text}`,
      }
    },
  })
}
