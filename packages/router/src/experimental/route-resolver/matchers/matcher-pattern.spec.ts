import { describe, expect, it } from 'vitest'
import {
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
} from './matcher-pattern'
import { MatcherPatternPathStar } from './matcher-pattern-path-star'
import { miss } from './errors'
import { definePathParamParser } from './param-parsers/types'

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

    it('keeps a trailing slash', () => {
      const pattern = new MatcherPatternPathStatic('/team/')
      expect(pattern.match('/team/')).toEqual({})
    })

    it('strict on trailing slash', () => {
      expect(() =>
        new MatcherPatternPathStatic('/team').match('/team/')
      ).toThrow()
      expect(() =>
        new MatcherPatternPathStatic('/team/').match('/team')
      ).toThrow()
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

    it('preserves case', () => {
      const pattern = new MatcherPatternPathStatic('/Team')
      expect(pattern.build()).toBe('/Team')
    })

    it('preserves trailing slash', () => {
      const pattern = new MatcherPatternPathStatic('/team/')
      expect(pattern.build()).toBe('/team/')
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

describe('MatcherPatternPathDynamic', () => {
  it('single param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/([^/]+?)\/b$/i,
      {
        // all defaults
        teamId: [{}],
      },
      ['teams', 1, 'b']
    )

    expect(pattern.match('/teams/123/b')).toEqual({
      teamId: '123',
    })
    expect(pattern.match('/teams/abc/b')).toEqual({
      teamId: 'abc',
    })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
  })

  it('decodes single param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/([^/]+?)$/i,
      {
        teamId: [{}],
      },
      ['teams', 1]
    )
    expect(pattern.match('/teams/a%20b')).toEqual({ teamId: 'a b' })
    expect(pattern.build({ teamId: 'a b' })).toBe('/teams/a%20b')
  })

  it('optional param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams(?:\/([^/]+?))?\/b$/i,
      {
        teamId: [{}, false, true],
      },
      ['teams', 1, 'b']
    )

    expect(pattern.match('/teams/b')).toEqual({ teamId: null })
    expect(pattern.match('/teams/123/b')).toEqual({ teamId: '123' })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(() => pattern.match('/teams//b')).toThrow()
    expect(pattern.build({ teamId: '123' })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: null })).toBe('/teams/b')
    expect(pattern.build({ teamId: '' })).toBe('/teams/b')
  })

  it('optional param in the end', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams(?:\/([^/]+?))?$/i,
      {
        teamId: [{}, false, true],
      },
      ['teams', 1]
    )

    expect(pattern.match('/teams')).toEqual({ teamId: null })
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.match('/teams/123')).toEqual({ teamId: '123' })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams//b')).toThrow()
    expect(pattern.build({ teamId: '123' })).toBe('/teams/123')
    expect(pattern.build({ teamId: null })).toBe('/teams')
    expect(pattern.build({ teamId: '' })).toBe('/teams')
  })

  it('repeatable param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/(.+?)\/b$/i,
      {
        teamId: [{}, true],
      },
      ['teams', 1, 'b']
    )

    expect(pattern.match('/teams/123/b')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/b')).toEqual({
      teamId: ['123', '456'],
    })
    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()
    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/b')
  })

  it('repeatable param in the end', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/(.+?)$/i,
      {
        teamId: [{}, true],
      },
      ['teams', 1]
    )

    expect(pattern.match('/teams/123')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456')).toEqual({ teamId: ['123', '456'] })
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(() => pattern.match('/teams/123/')).toThrow()
    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456')
    expect(() => pattern.build({ teamId: [] })).toThrow()
  })

  it('catch all route', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/(.*)$/,
      { pathMatch: [] },
      [0],
      null
    )

    expect(pattern.match('/ok')).toEqual({ pathMatch: 'ok' })
    expect(pattern.match('/ok/ok/ok')).toEqual({ pathMatch: 'ok/ok/ok' })
    expect(pattern.match('/')).toEqual({ pathMatch: '' })
  })

  it('splat params with prefix', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/(.*)$/i,
      {
        pathMatch: [{}],
      },
      ['teams', 0],
      null
    )
    expect(pattern.match('/teams/')).toEqual({ pathMatch: '' })
    expect(pattern.match('/teams/123/b')).toEqual({ pathMatch: '123/b' })
    expect(() => pattern.match('/teams')).toThrow()
    expect(() => pattern.match('/teamso/123/c')).toThrow()

    expect(pattern.build({ pathMatch: null })).toBe('/teams/')
    expect(pattern.build({ pathMatch: '' })).toBe('/teams/')
    expect(pattern.build({ pathMatch: '124' })).toBe('/teams/124')
    expect(pattern.build({ pathMatch: '124/b' })).toBe('/teams/124/b')
  })

  it('splat param without prefix', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/(.*)$/,
      {
        pathMatch: [],
      },
      [0],
      null
    )
    expect(pattern.match('/')).toEqual({ pathMatch: '' })
    expect(pattern.match('/123/b')).toEqual({ pathMatch: '123/b' })
    expect(pattern.match('/anything/goes/here')).toEqual({
      pathMatch: 'anything/goes/here',
    })

    expect(pattern.build({ pathMatch: null })).toBe('/')
    expect(pattern.build({ pathMatch: '' })).toBe('/')
    expect(pattern.build({ pathMatch: '124' })).toBe('/124')
    expect(pattern.build({ pathMatch: '124/b' })).toBe('/124/b')
  })

  it('repeatable optional param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams(?:\/(.+?))?\/b$/i,
      {
        teamId: [{}, true, true],
      },
      ['teams', 1, 'b']
    )

    expect(pattern.match('/teams/123/b')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/b')).toEqual({
      teamId: ['123', '456'],
    })
    expect(pattern.match('/teams/b')).toEqual({ teamId: [] })

    expect(() => pattern.match('/teams/123/c')).toThrow()
    expect(() => pattern.match('/teams/123/b/c')).toThrow()

    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/b')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/b')
    expect(pattern.build({ teamId: [] })).toBe('/teams/b')
  })

  it('multiple params', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/([^/]+?)\/([^/]+?)$/i,
      {
        teamId: [{}],
        otherId: [{}],
      },
      ['teams', 1, 1]
    )

    expect(pattern.match('/teams/123/456')).toEqual({
      teamId: '123',
      otherId: '456',
    })
    expect(() => pattern.match('/teams/123')).toThrow()
    expect(() => pattern.match('/teams/123/456/c')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: '123', otherId: '456' })).toBe(
      '/teams/123/456'
    )
  })

  it('sub segments (params + static)', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/([^/]+?)-b-([^/]+?)$/i,
      {
        teamId: [{}],
        otherId: [{}],
      },
      ['teams', [1, '-b-', 1]]
    )

    expect(pattern.match('/teams/123-b-456')).toEqual({
      teamId: '123',
      otherId: '456',
    })
    expect(() => pattern.match('/teams/123-b')).toThrow()
    expect(() => pattern.match('/teams/123-b-456/c')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: '123', otherId: '456' })).toBe(
      '/teams/123-b-456'
    )
  })

  it('can have a trailing slash after a single param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/([^/]+?)\/$/i,
      {
        teamId: [],
      },
      ['teams', 1],
      true
    )

    expect(pattern.match('/teams/123/')).toEqual({
      teamId: '123',
    })
    expect(() => pattern.match('/teams/123')).toThrow()
    expect(() => pattern.match('/teams/123/b')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: '123' })).toBe('/teams/123/')
  })

  it('can have a trailing slash after a static segment', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/b\/$/i,
      {},
      ['teams', 'b'],
      true
    )

    expect(pattern.match('/teams/b/')).toEqual({})
    expect(() => pattern.match('/teams/b')).toThrow()
    expect(() => pattern.match('/teams/123/b')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({})).toBe('/teams/b/')
  })

  it('can have a trailing slash after repeatable param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams\/(.+?)\/$/,
      {
        teamId: [, true],
      },
      ['teams', 1],
      true
    )

    expect(pattern.match('/teams/123/')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/')).toEqual({
      teamId: ['123', '456'],
    })
    expect(() => pattern.match('/teams/123')).toThrow()
    expect(() => pattern.match('/teams/123/b')).toThrow()
    expect(() => pattern.match('/teams/')).toThrow()
    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/')
  })

  it('can have a trailing slash after optional repeatable param', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/teams(?:\/(.+?))?\/$/,
      {
        teamId: [{}, true, true],
      },
      ['teams', 1],
      true
    )

    expect(pattern.match('/teams/123/')).toEqual({ teamId: ['123'] })
    expect(pattern.match('/teams/123/456/')).toEqual({
      teamId: ['123', '456'],
    })
    expect(pattern.match('/teams/')).toEqual({ teamId: [] })

    expect(() => pattern.match('/teams/123')).toThrow()
    expect(() => pattern.match('/teams/123/b')).toThrow()

    expect(pattern.build({ teamId: ['123'] })).toBe('/teams/123/')
    expect(pattern.build({ teamId: ['123', '456'] })).toBe('/teams/123/456/')
    expect(pattern.build({ teamId: [] })).toBe('/teams/')
  })

  describe('custom param parsers', () => {
    const doubleParser = definePathParamParser({
      get: (v: string | null) => {
        const value = Number(v) * 2
        if (!Number.isFinite(value)) {
          throw miss()
        }
        return value
      },
      set: (v: number | null) => (v == null ? null : String(v / 2)),
    })

    const nullAwareParser = definePathParamParser({
      get: (v: string | null) => {
        if (v === null) return 'was-null'
        if (v === undefined) return 'was-undefined'
        return `processed-${v}`
      },
      set: (v: string | null) =>
        v === 'was-null' ? null : String(v).replace('processed-', ''),
    })

    it('single regular param', () => {
      const pattern = new MatcherPatternPathDynamic(
        /^\/teams\/([^/]+?)$/i,
        {
          teamId: [doubleParser],
        },
        ['teams', 1]
      )

      expect(pattern.match('/teams/123')).toEqual({ teamId: 246 })
      expect(() => pattern.match('/teams/abc')).toThrow()
      expect(pattern.build({ teamId: 246 })).toBe('/teams/123')
    })

    it('can transform optional params', () => {
      const pattern = new MatcherPatternPathDynamic(
        /^\/teams(?:\/([^/]+?))?$/i,
        {
          teamId: [doubleParser, false, true],
        },
        ['teams', 1]
      )

      expect(pattern.match('/teams')).toEqual({ teamId: 0 })
      expect(pattern.match('/teams/123')).toEqual({ teamId: 246 })
      expect(() => pattern.match('/teams/abc')).toThrow()
      expect(pattern.build({ teamId: 246 })).toBe('/teams/123')
      expect(pattern.build({ teamId: 0 })).toBe('/teams/0')
      expect(pattern.build({ teamId: null })).toBe('/teams')
    })

    it('handles null values in optional params with custom parser', () => {
      const pattern = new MatcherPatternPathDynamic(
        /^\/teams(?:\/([^/]+?))?$/i,
        {
          teamId: [nullAwareParser, false, true],
        },
        ['teams', 1]
      )

      expect(pattern.match('/teams')).toEqual({ teamId: 'was-null' })
      expect(pattern.match('/teams/hello')).toEqual({
        teamId: 'processed-hello',
      })
      expect(pattern.build({ teamId: 'was-null' })).toBe('/teams')
      expect(pattern.build({ teamId: 'processed-world' })).toBe('/teams/world')
    })
  })
})
