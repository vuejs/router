import { experimental_parseQuery as parseQuery } from './query'
import { experimental_parseURL as originalParseURL } from './location'
import { vi, describe, expect, it } from 'vitest'

describe('parseURL', () => {
  let parseURL = originalParseURL.bind(null, parseQuery)

  it('works with no query no hash', () => {
    expect(parseURL('/foo')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })
  })

  it('works with partial path with no query', () => {
    expect(parseURL('foo#hash')).toEqual({
      fullPath: '/foo#hash',
      path: '/foo',
      hash: '#hash',
      query: {},
    })
  })

  it('works with partial path', () => {
    expect(parseURL('foo?f=foo#hash')).toEqual({
      fullPath: '/foo?f=foo#hash',
      path: '/foo',
      hash: '#hash',
      query: { f: 'foo' },
    })
  })

  it('works with only query', () => {
    expect(parseURL('?f=foo')).toEqual({
      fullPath: '/?f=foo',
      path: '/',
      hash: '',
      query: { f: 'foo' },
    })
  })

  it('works with only hash', () => {
    expect(parseURL('#foo')).toEqual({
      fullPath: '/#foo',
      path: '/',
      hash: '#foo',
      query: {},
    })
  })

  it('works with partial path and current location', () => {
    expect(parseURL('foo', '/parent/bar')).toEqual({
      fullPath: '/parent/foo',
      path: '/parent/foo',
      hash: '',
      query: {},
    })
  })

  it('works with partial path with query and hash and current location', () => {
    expect(parseURL('foo?f=foo#hash', '/parent/bar')).toEqual({
      fullPath: '/parent/foo?f=foo#hash',
      path: '/parent/foo',
      hash: '#hash',
      query: { f: 'foo' },
    })
  })

  it('works with relative query and current location', () => {
    expect(parseURL('?f=foo', '/parent/bar')).toEqual({
      fullPath: '/parent/bar?f=foo',
      path: '/parent/bar',
      hash: '',
      query: { f: 'foo' },
    })
  })

  it('works with relative hash and current location', () => {
    expect(parseURL('#hash', '/parent/bar')).toEqual({
      fullPath: '/parent/bar#hash',
      path: '/parent/bar',
      hash: '#hash',
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

  it('extracts multiple query parameters as an array', () => {
    expect(parseURL('/foo?a=one&a=two&a=three')).toEqual({
      fullPath: '/foo?a=one&a=two&a=three',
      path: '/foo',
      hash: '',
      query: { a: ['one', 'two', 'three'] },
    })
  })

  it('correctly parses a ? after the hash', () => {
    expect(parseURL('/foo#?a=one')).toEqual({
      fullPath: '/foo#?a=one',
      path: '/foo',
      hash: '#?a=one',
      query: {},
    })
    expect(parseURL('/foo/?a=two#?a=one')).toEqual({
      fullPath: '/foo/?a=two#?a=one',
      path: '/foo/',
      hash: '#?a=one',
      query: { a: 'two' },
    })
  })

  it('works with empty query', () => {
    expect(parseURL('/foo?#hash')).toEqual({
      fullPath: '/foo?#hash',
      path: '/foo',
      hash: '#hash',
      query: {},
    })
    expect(parseURL('/foo#hash')).toEqual({
      fullPath: '/foo#hash',
      path: '/foo',
      hash: '#hash',
      query: {},
    })
    expect(parseURL('/foo?')).toEqual({
      fullPath: '/foo?',
      path: '/foo',
      hash: '',
      query: {},
    })
    expect(parseURL('/foo')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })
  })

  it('works with empty hash', () => {
    expect(parseURL('/foo#')).toEqual({
      fullPath: '/foo#',
      path: '/foo',
      hash: '#',
      query: {},
    })
    expect(parseURL('/foo?#')).toEqual({
      fullPath: '/foo?#',
      path: '/foo',
      hash: '#',
      query: {},
    })
    expect(parseURL('/foo')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })
  })

  it('works with a relative paths', () => {
    expect(parseURL('foo', '/parent/bar')).toEqual({
      fullPath: '/parent/foo',
      path: '/parent/foo',
      hash: '',
      query: {},
    })
    expect(parseURL('./foo', '/parent/bar')).toEqual({
      fullPath: '/parent/foo',
      path: '/parent/foo',
      hash: '',
      query: {},
    })
    expect(parseURL('../foo', '/parent/bar')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })
    // cannot go below root
    expect(parseURL('../../foo', '/parent/bar')).toEqual({
      fullPath: '/foo',
      path: '/foo',
      hash: '',
      query: {},
    })

    expect(parseURL('', '/parent/bar')).toEqual({
      fullPath: '/parent/bar',
      path: '/parent/bar',
      hash: '',
      query: {},
    })
    expect(parseURL('#foo', '/parent/bar')).toEqual({
      fullPath: '/parent/bar#foo',
      path: '/parent/bar',
      hash: '#foo',
      query: {},
    })
    expect(parseURL('?o=o', '/parent/bar')).toEqual({
      fullPath: '/parent/bar?o=o',
      path: '/parent/bar',
      hash: '',
      query: { o: 'o' },
    })
  })

  it('calls parseQuery', () => {
    const parseQuery = vi.fn()
    originalParseURL(parseQuery, '/?é=é&é=a')
    expect(parseQuery).toHaveBeenCalledTimes(1)
    expect(parseQuery).toHaveBeenCalledWith('é=é&é=a')
  })
})
