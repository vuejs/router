import { describe, expect, it } from 'vitest'
import {
  MatcherPatternPathStatic,
  MatcherPatternPathStar,
} from './matcher-pattern'

describe('MatcherPatternPathStatic', () => {
  describe('match()', () => {
    it('matches exact path', () => {
      const pattern = new MatcherPatternPathStatic('/team')
      expect(pattern.match('/team')).toEqual({})
    })

    it('matches root path', () => {
      const pattern = new MatcherPatternPathStatic('/')
      expect(pattern.match('/')).toEqual({})
    })

    it('throws for non-matching path', () => {
      const pattern = new MatcherPatternPathStatic('/team')
      expect(() => pattern.match('/users')).toThrow()
      expect(() => pattern.match('/')).toThrow()
    })

    it('is case insensitive', () => {
      const pattern = new MatcherPatternPathStatic('/Team')
      expect(pattern.match('/team')).toEqual({})
      expect(pattern.match('/TEAM')).toEqual({})
      expect(pattern.match('/tEAm')).toEqual({})
    })
  })

  describe('build()', () => {
    it('returns the original path', () => {
      const pattern = new MatcherPatternPathStatic('/team')
      expect(pattern.build()).toBe('/team')
    })

    it('returns root path', () => {
      const pattern = new MatcherPatternPathStatic('/')
      expect(pattern.build()).toBe('/')
    })
  })
})

describe('MatcherPatternPathStar', () => {
  describe('match()', () => {
    it('matches everything by default', () => {
      const pattern = new MatcherPatternPathStar()
      expect(pattern.match('/anything')).toEqual({ pathMatch: '/anything' })
      expect(pattern.match('/')).toEqual({ pathMatch: '/' })
    })

    it('can match with a prefix', () => {
      const pattern = new MatcherPatternPathStar('/team')
      expect(pattern.match('/team')).toEqual({ pathMatch: '' })
      expect(pattern.match('/team/')).toEqual({ pathMatch: '/' })
      expect(pattern.match('/team/123')).toEqual({ pathMatch: '/123' })
      expect(pattern.match('/team/123/456')).toEqual({ pathMatch: '/123/456' })
    })

    it('throws if prefix does not match', () => {
      const pattern = new MatcherPatternPathStar('/teams')
      expect(() => pattern.match('/users')).toThrow()
      expect(() => pattern.match('/team')).toThrow()
    })

    it('is case insensitive', () => {
      const pattern = new MatcherPatternPathStar('/Team')
      expect(pattern.match('/team')).toEqual({ pathMatch: '' })
      expect(pattern.match('/TEAM')).toEqual({ pathMatch: '' })
      expect(pattern.match('/team/123')).toEqual({ pathMatch: '/123' })
    })

    it('keeps the case of the pathMatch', () => {
      const pattern = new MatcherPatternPathStar('/team')
      expect(pattern.match('/team/Hello')).toEqual({ pathMatch: '/Hello' })
      expect(pattern.match('/team/Hello/World')).toEqual({
        pathMatch: '/Hello/World',
      })
      expect(pattern.match('/tEaM/HElLo')).toEqual({ pathMatch: '/HElLo' })
    })
  })

  describe('build()', () => {
    it('builds path with pathMatch parameter', () => {
      const pattern = new MatcherPatternPathStar('/team')
      expect(pattern.build({ pathMatch: '/123' })).toBe('/team/123')
      expect(pattern.build({ pathMatch: '-ok' })).toBe('/team-ok')
    })

    it('builds path with empty pathMatch', () => {
      const pattern = new MatcherPatternPathStar('/team')
      expect(pattern.build({ pathMatch: '' })).toBe('/team')
    })

    it('keep paths as is', () => {
      const pattern = new MatcherPatternPathStar('/team/')
      expect(pattern.build({ pathMatch: '/hey' })).toBe('/team//hey')
    })
  })
})
