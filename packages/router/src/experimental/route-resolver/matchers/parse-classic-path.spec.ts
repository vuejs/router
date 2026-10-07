import { describe, expect, it } from 'vitest'
import { parseClassicPath } from './parse-classic-path'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './matcher-pattern'
import { MatchMiss } from './errors'
import { mockWarn } from '../../../../__tests__/vitest-mock-warn'

describe('parseClassicPath', () => {
  mockWarn()

  it('creates a static pattern for paths without params', () => {
    expect(parseClassicPath('/about')).toBeInstanceOf(MatcherPatternPathStatic)
    expect(parseClassicPath('/')).toBeInstanceOf(MatcherPatternPathStatic)
    expect(parseClassicPath('/users/:id')).toBeInstanceOf(
      MatcherPatternPathDynamic
    )
  })

  describe('match', () => {
    it('matches and builds escaped colons as static text', () => {
      const pattern = parseClassicPath('/literal\\:name/child')
      expect(pattern.match('/literal:name/child')).toEqual({})
      expect(pattern.build({})).toBe('/literal:name/child')
      expect(() => pattern.match('/literal\\:name/child')).toThrow(MatchMiss)
    })

    it('matches and builds escaped slashes as static text', () => {
      const pattern = parseClassicPath('/a\\/b')
      expect(pattern.match('/a/b')).toEqual({})
      expect(pattern.build({})).toBe('/a/b')
      expect(() => pattern.match('/a\\/b')).toThrow(MatchMiss)
    })

    it('matches and builds escaped backslashes as static text', () => {
      const pattern = parseClassicPath('/a\\\\b')
      expect(pattern.match('/a\\b')).toEqual({})
      expect(pattern.build({})).toBe('/a\\b')
      expect(() => pattern.match('/a\\\\b')).toThrow(MatchMiss)
    })

    it('preserves trailing slashes after escaped static text', () => {
      const pattern = parseClassicPath('/literal\\:name/')
      expect(pattern.match('/literal:name/')).toEqual({})
      expect(pattern.build({})).toBe('/literal:name/')
      expect(() => pattern.match('/literal:name')).toThrow(MatchMiss)
    })

    it('matches and builds the root path', () => {
      const pattern = parseClassicPath('/')
      expect(pattern.match('/')).toEqual({})
      expect(pattern.build({})).toBe('/')
      expect(() => pattern.match('')).toThrow(MatchMiss)
    })

    it('matches / with an empty path', () => {
      expect(parseClassicPath('').match('/')).toEqual({})
      expect(parseClassicPath('').build({})).toBe('/')
    })

    it('matches static paths case insensitively', () => {
      const pattern = parseClassicPath('/about')
      expect(pattern.match('/about')).toEqual({})
      expect(pattern.match('/About')).toEqual({})
      expect(() => pattern.match('/about/more')).toThrow(MatchMiss)
      expect(() => pattern.match('/other')).toThrow(MatchMiss)
    })

    it('is strict about trailing slashes', () => {
      expect(() => parseClassicPath('/about').match('/about/')).toThrow(
        MatchMiss
      )
      expect(() => parseClassicPath('/users/:id').match('/users/1/')).toThrow(
        MatchMiss
      )
      expect(parseClassicPath('/users/:id/').match('/users/1/')).toEqual({
        id: '1',
      })
      expect(() => parseClassicPath('/users/:id/').match('/users/1')).toThrow(
        MatchMiss
      )
    })

    it('matches params case insensitively', () => {
      const pattern = parseClassicPath('/users/:id')
      expect(pattern.match('/users/1')).toEqual({ id: '1' })
      expect(pattern.match('/Users/1')).toEqual({ id: '1' })
      expect(() => pattern.match('/users')).toThrow(MatchMiss)
      expect(() => pattern.match('/users/1/2')).toThrow(MatchMiss)
    })

    it('decodes params', () => {
      expect(parseClassicPath('/users/:id').match('/users/a%20b%2Fc')).toEqual({
        id: 'a b/c',
      })
    })

    it('respects custom regexps', () => {
      const pattern = parseClassicPath('/users/:id(\\d+)')
      expect(pattern.match('/users/12')).toEqual({ id: '12' })
      expect(() => pattern.match('/users/ab')).toThrow(MatchMiss)
    })

    it('sets missing optional params to null', () => {
      const pattern = parseClassicPath('/users/:id?')
      expect(pattern.match('/users')).toEqual({ id: null })
      expect(pattern.match('/users/1')).toEqual({ id: '1' })
    })

    it('matches a root optional param', () => {
      const pattern = parseClassicPath('/:id?')
      expect(pattern.match('/')).toEqual({ id: null })
      expect(pattern.match('/1')).toEqual({ id: '1' })
      expect(pattern.build({ id: null })).toBe('/')
      expect(pattern.build({ id: '1' })).toBe('/1')
    })

    it('matches optional params in sub segments', () => {
      const pattern = parseClassicPath('/a-:b?-c')
      expect(pattern.match('/a--c')).toEqual({ b: null })
      expect(pattern.match('/a-x-c')).toEqual({ b: 'x' })
    })

    it('returns arrays for repeatable params', () => {
      const pattern = parseClassicPath('/files/:path+')
      expect(pattern.match('/files/a')).toEqual({ path: ['a'] })
      expect(pattern.match('/files/a/b%20c')).toEqual({ path: ['a', 'b c'] })
      expect(() => pattern.match('/files')).toThrow(MatchMiss)
    })

    it('returns an empty array for missing optional repeatable params', () => {
      const pattern = parseClassicPath('/:pathMatch(.*)*')
      expect(pattern.match('/')).toEqual({ pathMatch: [] })
      expect(pattern.match('/a/b')).toEqual({ pathMatch: ['a', 'b'] })
    })

    it('matches anything with a splat param', () => {
      const pattern = parseClassicPath('/:pathMatch(.*)')
      expect(pattern.match('/')).toEqual({ pathMatch: '' })
      expect(pattern.match('/a/b/')).toEqual({ pathMatch: 'a/b/' })
    })

    it('warns about duplicated params', () => {
      parseClassicPath('/:id/:id')
      expect('duplicated params with name "id"').toHaveBeenWarned()
    })
  })

  describe('build', () => {
    it('builds static paths', () => {
      expect(parseClassicPath('/about').build({})).toBe('/about')
      expect(parseClassicPath('/about/').build({})).toBe('/about/')
      expect(parseClassicPath('/a/b').build({})).toBe('/a/b')
      expect(parseClassicPath('/a/b/').build({})).toBe('/a/b/')
    })

    it('builds and encodes params', () => {
      const pattern = parseClassicPath('/users/:id')
      expect(pattern.build({ id: '1' })).toBe('/users/1')
      expect(pattern.build({ id: 'a b/c' })).toBe('/users/a%20b%2Fc')
    })

    it('keeps the trailing slash', () => {
      expect(parseClassicPath('/users/:id/').build({ id: '1' })).toBe(
        '/users/1/'
      )
    })

    it('accepts numbers at runtime', () => {
      expect(
        // @ts-expect-error: the types only allow strings
        parseClassicPath('/users/:id').build({ id: 1 })
      ).toBe('/users/1')
    })

    it('omits null optional params', () => {
      expect(parseClassicPath('/users/:id?').build({ id: null })).toBe('/users')
    })

    it('builds repeatable params', () => {
      const pattern = parseClassicPath('/files/:path*')
      expect(pattern.build({ path: ['a', 'b c'] })).toBe('/files/a/b%20c')
      expect(pattern.build({ path: [] })).toBe('/files')
    })

    it('builds a catch all route', () => {
      const pattern = parseClassicPath('/:pathMatch(.*)*')
      expect(pattern.build({ pathMatch: ['a', 'b'] })).toBe('/a/b')
      expect(pattern.build({ pathMatch: [] })).toBe('/')
    })

    it('does not encode slashes of splat params', () => {
      expect(
        parseClassicPath('/:pathMatch(.*)').build({ pathMatch: 'a/b' })
      ).toBe('/a/b')
    })

    it('round trips params', () => {
      const pattern = parseClassicPath('/u/:id/:rest(.*)*')
      const params = { id: 'a/b', rest: ['c d', 'e'] }
      expect(pattern.match(pattern.build(params))).toEqual(params)
    })
  })
})
