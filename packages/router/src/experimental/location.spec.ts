import { experimental_parseQuery as parseQuery } from './query'
import {
  experimental_parseURL as originalParseURL,
  parseEncodedURL,
  experimental_stringifyURL as stringifyURL,
} from './location'
import { stringifyQuery } from '../query'
import { describe, expect, it } from 'vitest'

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
      query: { f: ['foo'] },
    })
  })

  it('works with only query', () => {
    expect(parseURL('?f=foo')).toEqual({
      fullPath: '/?f=foo',
      path: '/',
      hash: '',
      query: { f: ['foo'] },
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
      query: { f: ['foo'] },
    })
  })

  it('works with relative query and current location', () => {
    expect(parseURL('?f=foo', '/parent/bar')).toEqual({
      fullPath: '/parent/bar?f=foo',
      path: '/parent/bar',
      hash: '',
      query: { f: ['foo'] },
    })
  })

  it('works with relative query and hash and current location', () => {
    expect(parseURL('?f=foo#hash', '/parent/bar')).toEqual({
      fullPath: '/parent/bar?f=foo#hash',
      path: '/parent/bar',
      hash: '#hash',
      query: { f: ['foo'] },
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
        a: ['one'],
        b: ['two'],
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
      query: { a: ['one'] },
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
      query: { a: ['two'] },
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
      query: { o: ['o'] },
    })
  })

  describe('normalization like new URL()', () => {
    it('encodes characters like a browser', () => {
      expect(parseURL('/café b?q=a b#h b')).toEqual({
        // spaces in the query are `+` like stringifyQuery()
        fullPath: '/caf%C3%A9%20b?q=a+b#h%20b',
        path: '/caf%C3%A9%20b',
        hash: '#h%20b',
        query: { q: ['a b'] },
      })
    })

    it('writes encoded spaces in the query as +', () => {
      expect(parseURL('/a%20b?q=a%20b&%20=+')).toMatchObject({
        fullPath: '/a%20b?q=a+b&+=+',
        query: { q: ['a b'], ' ': [' '] },
      })
    })

    it('keeps percent encoded sequences and lone %', () => {
      expect(parseURL('/a%2Fb/%e9/100%?q=%25#%20%')).toMatchObject({
        fullPath: '/a%2Fb/%e9/100%?q=%25#%20%',
      })
    })

    it('resolves dot segments anywhere in the path', () => {
      expect(parseURL('/a/./b/../c').path).toBe('/a/c')
      expect(parseURL('/a/%2e%2e/b').path).toBe('/b')
    })

    it('ignores the current location for absolute paths', () => {
      expect(parseURL('/foo', '/parent/current').path).toBe('/foo')
    })

    it('keeps host and scheme like strings as paths', () => {
      expect(parseURL('//evil.com/x').path).toBe('//evil.com/x')
      // like browsers, `\\` is `/`
      expect(parseURL('/\\evil.com/x').path).toBe('//evil.com/x')
      expect(parseURL('javascript:alert(1)', '/parent/current').path).toBe(
        '/parent/javascript:alert(1)'
      )
    })
  })

  it('uses the parseQuery result as query', () => {
    const query = { custom: ['value'] }
    expect(originalParseURL(() => query, '/foo?x').query).toBe(query)
  })

  describe('hash', () => {
    it('keeps the hash as it appears in the URL, like location.hash', () => {
      expect(parseURL('/foo#%22%20%25')).toMatchObject({
        fullPath: '/foo#%22%20%25',
        hash: '#%22%20%25',
      })
      expect(parseURL('/foo#caf%C3%A9')).toMatchObject({
        fullPath: '/foo#caf%C3%A9',
        hash: '#caf%C3%A9',
      })
      expect(parseURL('/foo#%26')).toMatchObject({
        fullPath: '/foo#%26',
        hash: '#%26',
      })
      // userland structure like OAuth fragments is preserved
      expect(parseURL('/foo#a=b%26c&d=e')).toMatchObject({
        fullPath: '/foo#a=b%26c&d=e',
        hash: '#a=b%26c&d=e',
      })
      expect(parseURL('/foo#100%')).toMatchObject({
        fullPath: '/foo#100%',
        hash: '#100%',
      })
    })
  })
})

describe('parseEncodedURL', () => {
  it('does not normalize the location', () => {
    expect(parseEncodedURL(parseQuery, '/a/./café b?q=a b#h b')).toEqual({
      fullPath: '/a/./café b?q=a b#h b',
      path: '/a/./café b',
      hash: '#h b',
      query: { q: ['a b'] },
    })
  })
})

describe('stringifyURL', () => {
  it('joins path, query and hash', () => {
    expect(stringifyURL(stringifyQuery, '/foo', { a: ['1', '2'] }, '#h')).toBe(
      '/foo?a=1&a=2#h'
    )
  })

  it('omits the ? for an empty query', () => {
    expect(stringifyURL(stringifyQuery, '/foo', {})).toBe('/foo')
    expect(stringifyURL(stringifyQuery, '/foo')).toBe('/foo')
  })

  it('appends the hash as is', () => {
    expect(stringifyURL(stringifyQuery, '/foo', {}, '#%20 a')).toBe(
      '/foo#%20 a'
    )
  })
})
