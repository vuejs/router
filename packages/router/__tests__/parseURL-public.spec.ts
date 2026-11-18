// Pins the behavior of the `_parseURL` / `_stringifyURL` exports used by
// integrations like Nuxt. Changes here are visible to them.
// Common cases are in location.spec.ts, only the extra contract is here.
import { describe, expect, it } from 'vitest'
import {
  _parseURL,
  _stringifyURL,
  parseQuery,
  stringifyQuery,
  createRouter,
  createMemoryHistory,
} from '../src'

const parse = (location: string, currentLocation?: string) =>
  _parseURL(parseQuery, location, currentLocation)

describe('_parseURL', () => {
  it('uses parseQuery only for the search', () => {
    const query = { custom: 'value' }
    expect(_parseURL(() => query, '/foo?x').query).toBe(query)
    expect(_parseURL(() => query, '/foo#a?b').query).toEqual({})
  })

  it('does not decode the path', () => {
    expect(parse('/caf%C3%A9#caf%C3%A9')).toMatchObject({
      path: '/caf%C3%A9',
      fullPath: '/caf%C3%A9#caf%C3%A9',
      hash: '#café',
    })
  })

  it('does not normalize . and .. in absolute paths', () => {
    expect(parse('/a/../b/./c').path).toBe('/a/../b/./c')
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

  it('matches router.resolve() for strings', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:p(.*)*', component: {} }],
    })
    await router.push('/foo/bar')
    for (const url of [
      '/a?b=1&b=2&c#h',
      '/x?',
      '/x#',
      '/x#%20',
      '/x?#y',
      'baz?a=1',
      '?a=1#h',
      '#h',
    ]) {
      const { path, fullPath, query, hash } = router.resolve(url)
      expect(parse(url, '/foo/bar')).toEqual({ path, fullPath, query, hash })
    }
  })
})

describe('_stringifyURL', () => {
  const stringify = (location: Parameters<typeof _stringifyURL>[1]) =>
    _stringifyURL(stringifyQuery, location)

  it('omits the ? for an empty query', () => {
    expect(stringify({ path: '/foo', query: {} })).toBe('/foo')
    expect(stringify({ path: '/foo', query: { a: undefined } })).toBe('/foo')
  })

  it('uses a custom stringifyQuery only with a query', () => {
    expect(
      _stringifyURL(() => 'custom', { path: '/foo', query: { a: '1' } })
    ).toBe('/foo?custom')
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
