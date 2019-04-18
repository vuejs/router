if (typeof global !== 'undefined' && typeof global.beforeAll === 'undefined') {
  global.beforeAll = global.before
  global.afterAll = global.after

  const mocks = require('jest-mock')
  global.jest = mocks

  const expect = require('expect')
  // monkey patch jest snapshots
  expect.extend({
    toMatchInlineSnapshot(received, snapshot) {
      const text = `[${received.toString()}]`
      const pass = text === snapshot
      return {
        pass,
        message: () => 'Snapshot not maching: ' + text,
      }
    },
  })
}
