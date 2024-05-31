import { parseQuery, stringifyQuery } from '../src/query'
import {
  parseURL as originalParseURL,
  stringifyURL as originalStringifyURL,
  stripBase,
  isSameRouteLocationParams,
  isSameRouteLocation,
  resolveRelativePath,
} from '../src/location'
import { RouteLocationNormalizedLoaded } from 'src'
import { mockWarn } from 'jest-mock-warn'

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

  it('parses ? after the hash', () => {
    expect(parseURL('/foo#?a=one')).toEqual({
      fullPath: '/foo#?a=one',
      path: '/foo',
      hash: '#?a=one',
      query: {},
    })
    expect(parseURL('/foo/#?a=one')).toEqual({
      fullPath: '/foo/#?a=one',
      path: '/foo/',
      hash: '#?a=one',
      query: {},
    })
  })

  it('calls parseQuery', () => {
    const parseQuery = jest.fn()
    originalParseURL(parseQuery, '/?é=é&é=a')
    expect(parseQuery).toHaveBeenCalledTimes(1)
    expect(parseQuery).toHaveBeenCalledWith('é=é&é=a')
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

  it('calls stringifyQuery', () => {
    const stringifyQuery = jest.fn()
    originalStringifyURL(stringifyQuery, {
      path: '/',
      query: { é: 'é', b: 'a' },
    })
    expect(stringifyQuery).toHaveBeenCalledTimes(1)
    expect(stringifyQuery).toHaveBeenCalledWith({ é: 'é', b: 'a' })
  })
})

describe('stripBase', () => {
  it('returns the pathname if no base', () => {
    expect(stripBase('', '')).toBe('')
    expect(stripBase('/', '')).toBe('/')
    expect(stripBase('/thing', '')).toBe('/thing')
  })

  it('is case insensitive', () => {
    expect(stripBase('/Base/foo', '/base')).toBe('/foo')
    expect(stripBase('/Basé/foo', '/base')).toBe('/Basé/foo')
    expect(stripBase('/Basé/foo', '/basé')).toBe('/foo')
    expect(stripBase('/base/foo', '/Base')).toBe('/foo')
    expect(stripBase('/base/foo', '/Basé')).toBe('/base/foo')
    expect(stripBase('/basé/foo', '/Basé')).toBe('/foo')
  })

  it('returns the pathname without the base', () => {
    expect(stripBase('/base', '/base')).toBe('/')
    expect(stripBase('/base/', '/base')).toBe('/')
    expect(stripBase('/base/foo', '/base')).toBe('/foo')
  })
})

describe('isSameRouteLocationParams', () => {
  it('compare simple values', () => {
    expect(isSameRouteLocationParams({ a: '2' }, { a: '2' })).toBe(true)
    expect(isSameRouteLocationParams({ a: '3' }, { a: '2' })).toBe(false)
    // different order
    expect(
      isSameRouteLocationParams({ a: '2', b: '3' }, { b: '3', a: '2' })
    ).toBe(true)
    expect(
      isSameRouteLocationParams({ a: '3', b: '3' }, { b: '3', a: '2' })
    ).toBe(false)
  })

  it('compare array values', () => {
    expect(isSameRouteLocationParams({ a: ['2'] }, { a: ['2'] })).toBe(true)
    expect(isSameRouteLocationParams({ a: ['3'] }, { a: ['2'] })).toBe(false)
    // different order
    expect(
      isSameRouteLocationParams({ a: ['2'], b: ['3'] }, { b: ['3'], a: ['2'] })
    ).toBe(true)
    expect(
      isSameRouteLocationParams({ a: ['3'], b: ['3'] }, { b: ['3'], a: ['2'] })
    ).toBe(false)
  })

  it('considers arrays of one item same as the item itself', () => {
    expect(isSameRouteLocationParams({ a: ['2'] }, { a: '2' })).toBe(true)
    expect(isSameRouteLocationParams({ a: ['3'] }, { a: '2' })).toBe(false)
  })
})

describe('isSameRouteLocation', () => {
  it('compares queries as strings', () => {
    const location: RouteLocationNormalizedLoaded = {
      path: '/',
      params: {},
      name: 'home',
      matched: [{} as any],
      fullPath: '/',
      hash: '',
      meta: {},
      query: {},
      redirectedFrom: undefined,
    }
    expect(
      isSameRouteLocation(
        () => 'fake query',
        { ...location, query: { a: 'a' } },
        { ...location, query: { b: 'b' } }
      )
    ).toBe(true)
  })
})

describe('resolveRelativePath', () => {
  mockWarn()
  it('resolves relative direct path', () => {
    expect(resolveRelativePath('add', '/users/posva')).toBe('/users/add')
    expect(resolveRelativePath('add', '/users/posva/')).toBe('/users/posva/add')
    expect(resolveRelativePath('add', '/users/posva/thing')).toBe(
      '/users/posva/add'
    )
  })

  it('resolves relative direct path with .', () => {
    expect(resolveRelativePath('./add', '/users/posva')).toBe('/users/add')
    expect(resolveRelativePath('./add', '/users/posva/')).toBe(
      '/users/posva/add'
    )
    expect(resolveRelativePath('./add', '/users/posva/thing')).toBe(
      '/users/posva/add'
    )
  })

  it('resolves relative path with ..', () => {
    expect(resolveRelativePath('../add', '/users/posva')).toBe('/add')
    expect(resolveRelativePath('../add', '/users/posva/')).toBe('/users/add')
    expect(resolveRelativePath('../add', '/users/posva/thing')).toBe(
      '/users/add'
    )
  })

  it('resolves multiple relative paths with ..', () => {
    expect(resolveRelativePath('../../add', '/users/posva')).toBe('/add')
    expect(resolveRelativePath('../../add', '/users/posva/')).toBe('/add')
    expect(resolveRelativePath('../../add', '/users/posva/thing')).toBe('/add')
    expect(resolveRelativePath('../../../add', '/users/posva')).toBe('/add')
  })

  it('works with the root', () => {
    expect(resolveRelativePath('add', '/')).toBe('/add')
    expect(resolveRelativePath('./add', '/')).toBe('/add')
    expect(resolveRelativePath('../add', '/')).toBe('/add')
    expect(resolveRelativePath('.././add', '/')).toBe('/add')
    expect(resolveRelativePath('./../add', '/')).toBe('/add')
    expect(resolveRelativePath('../../add', '/')).toBe('/add')
    expect(resolveRelativePath('../../../add', '/')).toBe('/add')
    expect(resolveRelativePath('a/add', '/')).toBe('/a/add')
    expect(resolveRelativePath('./a/add', '/')).toBe('/a/add')
    expect(resolveRelativePath('../a/add', '/')).toBe('/a/add')
  })

  it('ignores it location is absolute', () => {
    expect(resolveRelativePath('/add', '/users/posva')).toBe('/add')
  })

  it('works without anything after the .', () => {
    expect(resolveRelativePath('./', '/users/posva')).toBe('/users/')
    expect(resolveRelativePath('.', '/users/posva')).toBe('/users/')
  })

  it('works without anything after the ..', () => {
    expect(resolveRelativePath('../', '/users/posva')).toBe('/')
    expect(resolveRelativePath('../', '/users/posva/new')).toBe('/users/')
    expect(resolveRelativePath('../../', '/users/posva/a/b')).toBe('/users/')
    expect(resolveRelativePath('..', '/users/posva/new')).toBe('/users/')
    expect(resolveRelativePath('../..', '/users/posva/a/b')).toBe('/users/')
  })

  it('resolves empty path', () => {
    expect(resolveRelativePath('', '/users/posva')).toBe('/users/posva')
    expect(resolveRelativePath('', '/users')).toBe('/users')
    expect(resolveRelativePath('', '/')).toBe('/')
  })

  it('warns if from path is not absolute', () => {
    resolveRelativePath('path', 'other')
    resolveRelativePath('path', './other')
    resolveRelativePath('path', '../other')

    expect('Cannot resolve').toHaveBeenWarnedTimes(3)
  })
})
