import { describe, expect, it } from 'vitest'
import { MatcherPatternPathParser } from './matcher-pattern-path-parser'
import { MatchMiss } from './errors'

describe('MatcherPatternPathParser', () => {
  describe('match', () => {
    it('matches static paths case insensitively', () => {
      const pattern = new MatcherPatternPathParser('/about')
      expect(pattern.match('/about')).toEqual({})
      expect(pattern.match('/About')).toEqual({})
      expect(pattern.match('/about/')).toEqual({})
      expect(() => pattern.match('/about/more')).toThrow(MatchMiss)
      expect(() => pattern.match('/other')).toThrow(MatchMiss)
    })

    it('matches params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(pattern.match('/users/1')).toEqual({ id: '1' })
      expect(() => pattern.match('/users')).toThrow(MatchMiss)
      expect(() => pattern.match('/users/1/2')).toThrow(MatchMiss)
    })

    it('decodes params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(pattern.match('/users/a%20b%2Fc')).toEqual({ id: 'a b/c' })
    })

    it('respects custom regexps', () => {
      const pattern = new MatcherPatternPathParser('/users/:id(\\d+)')
      expect(pattern.match('/users/12')).toEqual({ id: '12' })
      expect(() => pattern.match('/users/ab')).toThrow(MatchMiss)
    })

    it('sets missing optional params to null', () => {
      const pattern = new MatcherPatternPathParser('/users/:id?')
      expect(pattern.match('/users')).toEqual({ id: null })
      expect(pattern.match('/users/1')).toEqual({ id: '1' })
    })

    it('returns arrays for repeatable params', () => {
      const pattern = new MatcherPatternPathParser('/files/:path+')
      expect(pattern.match('/files/a')).toEqual({ path: ['a'] })
      expect(pattern.match('/files/a/b%20c')).toEqual({ path: ['a', 'b c'] })
      expect(() => pattern.match('/files')).toThrow(MatchMiss)
    })

    it('returns an empty array for missing optional repeatable params', () => {
      const pattern = new MatcherPatternPathParser('/:pathMatch(.*)*')
      expect(pattern.match('/')).toEqual({ pathMatch: [] })
      expect(pattern.match('/a/b')).toEqual({ pathMatch: ['a', 'b'] })
    })

    it('keeps an empty string for required params that match nothing', () => {
      const pattern = new MatcherPatternPathParser('/:pathMatch(.*)')
      expect(pattern.match('/')).toEqual({ pathMatch: '' })
    })

    it('supports the strict option', () => {
      const pattern = new MatcherPatternPathParser('/about', { strict: true })
      expect(pattern.match('/about')).toEqual({})
      expect(() => pattern.match('/about/')).toThrow(MatchMiss)
    })

    it('supports the sensitive option', () => {
      const pattern = new MatcherPatternPathParser('/about', {
        sensitive: true,
      })
      expect(pattern.match('/about')).toEqual({})
      expect(() => pattern.match('/About')).toThrow(MatchMiss)
    })

    it('supports the end option', () => {
      const pattern = new MatcherPatternPathParser('/about', { end: false })
      expect(pattern.match('/about/more')).toEqual({})
    })
  })

  describe('build', () => {
    it('builds static paths', () => {
      expect(new MatcherPatternPathParser('/about').build({})).toBe('/about')
    })

    it('builds and encodes params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(pattern.build({ id: '1' })).toBe('/users/1')
      expect(pattern.build({ id: 'a b/c' })).toBe('/users/a%20b%2Fc')
    })

    it('accepts numbers', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(pattern.build({ id: 1 })).toBe('/users/1')
    })

    it('omits empty optional params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id?')
      expect(pattern.build({ id: null })).toBe('/users')
      expect(pattern.build({ id: undefined })).toBe('/users')
      expect(pattern.build({ id: '' })).toBe('/users')
      expect(pattern.build({})).toBe('/users')
    })

    it('builds repeatable params', () => {
      const pattern = new MatcherPatternPathParser('/files/:path*')
      expect(pattern.build({ path: ['a', 'b c'] })).toBe('/files/a/b%20c')
      expect(pattern.build({ path: [] })).toBe('/files')
    })

    it('builds a catch all route', () => {
      const pattern = new MatcherPatternPathParser('/:pathMatch(.*)*')
      expect(pattern.build({ pathMatch: ['a', 'b'] })).toBe('/a/b')
      expect(pattern.build({ pathMatch: [] })).toBe('/')
    })

    it('throws with missing required params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(() => pattern.build({})).toThrow('Missing required param "id"')
    })

    it('throws with arrays for non repeatable params', () => {
      const pattern = new MatcherPatternPathParser('/users/:id')
      expect(() => pattern.build({ id: ['a', 'b'] })).toThrow(
        'is an array but it is not repeatable'
      )
    })

    it('round trips params', () => {
      const pattern = new MatcherPatternPathParser('/u/:id/:rest(.*)*')
      const params = { id: 'a/b', rest: ['c d', 'e'] }
      expect(pattern.match(pattern.build(params))).toEqual(params)
    })
  })
})
