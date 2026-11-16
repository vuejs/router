// Pins the behavior of the `_parseURL` / `_stringifyURL` exports used by
// integrations like Nuxt. Changes here are visible to them.
import { describe, expect, it } from 'vitest'
import {
  _parseURL,
  _stringifyURL,
  parseQuery,
  stringifyQuery,
  createRouter,
  createMemoryHistory,
} from '../src'
import { mockWarn } from './vitest-mock-warn'

const parse = (location: string, currentLocation?: string) =>
  _parseURL(parseQuery, location, currentLocation)

describe('_parseURL', () => {
  mockWarn()

  it('parses path, query and hash', () => {
    expect(parse('/foo/bar?a=1&b=2&b=3#h')).toEqual({
      path: '/foo/bar',
      fullPath: '/foo/bar?a=1&b=2&b=3#h',
      query: { a: '1', b: ['2', '3'] },
      hash: '#h',
    })
  })

  it('passes the search without the leading ? to parseQuery', () => {
    const searches: string[] = []
    _parseURL(search => {
      searches.push(search)
      return {}
    }, '/foo?a=1')
    expect(searches).toEqual(['a=1'])
  })

  it('uses the returned value of parseQuery as query', () => {
    const query = { custom: 'value' }
    expect(_parseURL(() => query, '/foo?x').query).toBe(query)
  })

  it('does not call parseQuery without a ?', () => {
    let called = false
    _parseURL(() => {
      called = true
      return {}
    }, '/foo#a?b')
    expect(called).toBe(false)
  })

  it('treats a ? after the # as part of the hash', () => {
    expect(parse('/foo#h?a=1')).toEqual({
      path: '/foo',
      fullPath: '/foo#h?a=1',
      query: {},
      hash: '#h?a=1',
    })
  })

  it('keeps a bare ? in fullPath with an empty query', () => {
    expect(parse('/foo?')).toEqual({
      path: '/foo',
      fullPath: '/foo?',
      query: {},
      hash: '',
    })
  })

  it('keeps a bare trailing # as hash', () => {
    expect(parse('/foo#')).toEqual({
      path: '/foo',
      fullPath: '/foo#',
      query: {},
      hash: '#',
    })
    expect(parse('/foo?#')).toEqual({
      path: '/foo',
      fullPath: '/foo?#',
      query: {},
      hash: '#',
    })
  })

  it('decodes the hash but not the path nor fullPath', () => {
    expect(parse('/caf%C3%A9?q=%20#caf%C3%A9')).toEqual({
      path: '/caf%C3%A9',
      fullPath: '/caf%C3%A9?q=%20#caf%C3%A9',
      query: { q: ' ' },
      hash: '#café',
    })
  })

  it('does not normalize . and .. in absolute paths', () => {
    expect(parse('/a/../b/./c').path).toBe('/a/../b/./c')
  })

  describe('currentLocation', () => {
    it('defaults to /', () => {
      expect(parse('foo')).toMatchObject({ path: '/foo', fullPath: '/foo' })
      expect(parse('')).toMatchObject({ path: '/', fullPath: '/' })
      expect(parse('?a=1')).toEqual({
        path: '/',
        fullPath: '/?a=1',
        query: { a: '1' },
        hash: '',
      })
      expect(parse('#h')).toEqual({
        path: '/',
        fullPath: '/#h',
        query: {},
        hash: '#h',
      })
      expect(parse('?')).toMatchObject({ path: '/', fullPath: '/?' })
      expect(parse('#')).toMatchObject({
        path: '/',
        fullPath: '/#',
        hash: '#',
      })
    })

    it('resolves relative paths against it', () => {
      expect(parse('baz?a=1', '/foo/bar')).toMatchObject({
        path: '/foo/baz',
        fullPath: '/foo/baz?a=1',
      })
      expect(parse('../baz', '/a/b/c').path).toBe('/a/baz')
      expect(parse('./', '/a/b').path).toBe('/a/')
    })

    it('keeps its path for a query or hash only location', () => {
      expect(parse('?a=1', '/foo/bar').fullPath).toBe('/foo/bar?a=1')
      expect(parse('#h', '/foo/bar').fullPath).toBe('/foo/bar#h')
      expect(parse('', '/foo/bar').fullPath).toBe('/foo/bar')
    })

    it('ignores it for absolute paths', () => {
      expect(parse('/x', '/foo/bar').path).toBe('/x')
    })

    it('warns and keeps the relative path if it is not absolute', () => {
      expect(parse('foo', 'bar').path).toBe('foo')
      expect('Cannot resolve a relative location').toHaveBeenWarned()
    })
  })

  // Not supported: no protocol or host parsing.
  describe('full URLs', () => {
    it('treats a URL with a protocol as a relative path', () => {
      expect(parse('https://example.com/x?y#z')).toEqual({
        path: '/https://example.com/x',
        fullPath: '/https://example.com/x?y#z',
        query: { y: null },
        hash: '#z',
      })
    })

    it('keeps a protocol relative URL in path', () => {
      expect(parse('//example.com/x?y')).toMatchObject({
        path: '//example.com/x',
        query: { y: null },
      })
    })
  })

  it('matches router.resolve() for strings', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p(.*)*', component: {} }],
    })
    for (const url of ['/a?b=1&b=2&c#h', '/x?', '/x#', '/x#%20', '/x?#y']) {
      const { path, fullPath, query, hash } = router.resolve(url)
      expect(parse(url)).toEqual({ path, fullPath, query, hash })
    }
  })
})

describe('_stringifyURL', () => {
  const stringify = (location: Parameters<typeof _stringifyURL>[1]) =>
    _stringifyURL(stringifyQuery, location)

  it('joins path, query and hash', () => {
    expect(
      stringify({ path: '/foo', query: { a: '1', b: ['2', '3'] }, hash: '#h' })
    ).toBe('/foo?a=1&b=2&b=3#h')
  })

  it('omits the ? for an empty query', () => {
    expect(stringify({ path: '/foo', query: {} })).toBe('/foo')
    expect(stringify({ path: '/foo', query: { a: undefined } })).toBe('/foo')
    expect(stringify({ path: '/foo' })).toBe('/foo')
  })

  it('uses a custom stringifyQuery', () => {
    expect(
      _stringifyURL(() => 'custom', { path: '/foo', query: { a: '1' } })
    ).toBe('/foo?custom')
    // not called without a query
    expect(_stringifyURL(() => 'custom', { path: '/foo' })).toBe('/foo')
  })

  it('does not encode the path or the hash', () => {
    expect(stringify({ path: '/a b', hash: '#c d' })).toBe('/a b#c d')
  })

  it('does not add the # to the hash', () => {
    expect(stringify({ path: '/foo', hash: 'h' })).toBe('/fooh')
  })

  it('does not merge a query that is already in the path', () => {
    expect(stringify({ path: '/foo?a=1', query: { b: '2' } })).toBe(
      '/foo?a=1?b=2'
    )
  })

  it('rebuilds a parsed location, re-encoding the query', () => {
    const { path, query, hash } = parse('/a?b=1&b=2&c&d=%20#%20')
    // the hash is decoded by parseURL, the query is re-encoded by stringifyQuery
    expect(stringify({ path, query, hash })).toBe('/a?b=1&b=2&c&d=+# ')
  })
})
