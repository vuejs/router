// @ts-check
require('./helper')
const expect = require('expect')
const { BaseHistory } = require('../src/history/base')

const parseURL = BaseHistory.prototype.parseURL

describe('URL parsing', () => {
  it('works with no query no hash', () => {
    expect(parseURL('/foo')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })
  })

  it('extracts the query', () => {
    expect(parseURL('/foo?a=one&b=two')).toEqual({
      fullPath: '/foo?a=one&b=two',
      path: '/foo',
      hash: '',
      query: {
        a: 'one',
        b: 'two',
      },
    })
  })

  it('extracts the hash', () => {
    expect(parseURL('/foo#bar')).toEqual({
      fullPath: '/foo#bar',
      path: '/foo',
      hash: '#bar',
      query: {},
    })
  })

  it('extracts query and hash', () => {
    expect(parseURL('/foo?a=one#bar')).toEqual({
      fullPath: '/foo?a=one#bar',
      path: '/foo',
      hash: '#bar',
      query: { a: 'one' },
    })
  })
})
