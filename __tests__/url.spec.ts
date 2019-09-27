import {
  parseURL,
  stringifyURL,
  normalizeLocation,
} from '../src/history/utils'

describe('parseURL', () => {
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
    expect(normalizeLocation('/foo')).toEqual(parseURL('/foo'))
  })

  it('works with objects', () => {
    expect(
      normalizeLocation({
        path: '/foo',
      })
    ).toEqual({ path: '/foo', fullPath: '/foo', query: {}, hash: '' })
  })

  it('works with objects and keeps query and hash', () => {
    expect(
      normalizeLocation({
        path: '/foo',
        query: { foo: 'a' },
        hash: '#hey',
      })
    ).toEqual({
      path: '/foo',
      fullPath: '/foo?foo=a#hey',
      query: { foo: 'a' },
      hash: '#hey',
    })
  })
})
