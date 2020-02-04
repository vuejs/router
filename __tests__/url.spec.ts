import {
  parseURL as originalParseURL,
  stringifyURL as originalStringifyURL,
  parseQuery,
  stringifyQuery,
  normalizeHistoryLocation as normalizeLocation,
} from '../src/history/common'

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

  it('extracts multiple query paramenters as an array', () => {
    expect(parseURL('/foo?a=one&a=two&a=three')).toEqual({
      fullPath: '/foo?a=one&a=two&a=three',
      path: '/foo',
      hash: '',
      query: { a: ['one', 'two', 'three'] },
    })
  })
})

describe('stringifyURL', () => {
  let stringifyURL = originalStringifyURL.bind(null, stringifyQuery)

  it('stringifies a path', () => {
    expect(
      stringifyURL({
        path: '/some-path',
      })
    ).toBe('/some-path')
  })

  it('stringifies a query with arrays', () => {
    expect(
      stringifyURL({
        path: '/path',
        query: {
          foo: ['a1', 'a2'],
          bar: 'b',
        },
      })
    ).toBe('/path?foo=a1&foo=a2&bar=b')
  })

  it('stringifies a query', () => {
    expect(
      stringifyURL({
        path: '/path',
        query: {
          foo: 'a',
          bar: 'b',
        },
      })
    ).toBe('/path?foo=a&bar=b')
  })

  it('stringifies a hash', () => {
    expect(
      stringifyURL({
        path: '/path',
        hash: '#hey',
      })
    ).toBe('/path#hey')
  })

  it('stringifies a query and a hash', () => {
    expect(
      stringifyURL({
        path: '/path',
        query: {
          foo: 'a',
          bar: 'b',
        },
        hash: '#hey',
      })
    ).toBe('/path?foo=a&bar=b#hey')
  })
})

describe('normalizeLocation', () => {
  it('works with string', () => {
    expect(normalizeLocation('/foo')).toEqual({ fullPath: '/foo' })
  })

  it('works with objects', () => {
    expect(
      normalizeLocation({
        fullPath: '/foo',
      })
    ).toEqual({ fullPath: '/foo' })
  })
})
