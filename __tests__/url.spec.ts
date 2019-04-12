import './helper.js'
import expect from 'expect'
import { BaseHistory } from '../src/history/base'

const parseURL = BaseHistory.prototype.parseURL

describe('URL parsing', () => {
  it('works with no query no hash', () => {
    expect(parseURL('/foo')).toEqual({
      path: '/foo',
      hash: '',
      query: {},
    })
  })

  it('extracts the query', () => {
    expect(parseURL('/foo?a=one&b=two')).toEqual({
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
      path: '/foo',
      hash: '#bar',
      query: {},
    })
  })

  it('extracts query and hash', () => {
    expect(parseURL('/foo?a=one#bar')).toEqual({
      path: '/foo',
      hash: '#bar',
      query: { a: 'one' },
    })
  })
})
