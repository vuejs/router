if (typeof global !== 'undefined' && typeof global.beforeAll === 'undefined') {
  global.beforeAll = global.before
  global.afterAll = global.after
}
