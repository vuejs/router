// @ts-check
require('./helper')
const expect = require('expect')
const { parseQuery } = require('../src/history/utils')

describe('parseQuery', () => {
  it('works with leading ?', () => {
    expect(parseQuery('?foo=a')).toEqual({
      foo: 'a',
    })
  })

  it('works without leading ?', () => {
    expect(parseQuery('foo=a')).toEqual({
      foo: 'a',
    })
  })
})
