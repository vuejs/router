import { describe, expect, it } from 'vitest'
import {
  MatcherPatternPathStatic,
  MatcherPatternPathDynamic,
} from './matcher-pattern'
import { MatcherPatternPathStar } from './matcher-pattern-path-star'
import { miss } from './errors'
import { defineParamParserRaw } from './param-parsers'
import { mockWarn } from '../../../../__tests__/vitest-mock-warn'

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

    it('keeps the declared case of the prefix', () => {
      const pattern = new MatcherPatternPathStar('/Team')
      expect(pattern.build({ pathMatch: '/123' })).toBe('/Team/123')
      // match() stays case insensitive
      expect(pattern.match('/team/123')).toEqual({ pathMatch: '/123' })
    })
  })
})

describe('MatcherPatternPathDynamic', () => {
  mockWarn()

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
        teamId: [undefined, true],
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

  it('can have params with slashes in their regex (end)', () => {
    const pattern = new MatcherPatternPathDynamic(
      // same as above but with multiple params, some encoded, other not
      /^\/(lang\/(en|fr))$/i,
      { p: [] },
      [0]
    )

    expect(pattern.match('/lang/en')).toEqual({ p: 'lang/en' })
    expect(pattern.match('/lang/fr')).toEqual({ p: 'lang/fr' })
    expect(() => pattern.match('/lang/de')).toThrow()
    expect(() => pattern.match('/lang/en/')).toThrow()

    expect(pattern.build({ p: 'lang/en' })).toBe('/lang/en')
    expect(pattern.build({ p: 'lang/fr' })).toBe('/lang/fr')
    // NOTE: the builder does not validate the param against the regex
    expect(() => pattern.build({ p: 'lang/de' })).not.toThrow()
    expect(() => pattern.build({ p: 'lang/fr/' })).not.toThrow()
  })

  it('can have params with slashes in their regex (middle)', () => {
    const pattern = new MatcherPatternPathDynamic(
      // same as above but with multiple params, some encoded, other not
      /^\/prefix\/(lang\/(en|fr))\/suffix$/i,
      { p: [] },
      ['prefix', 0, 'suffix']
    )

    expect(pattern.match('/prefix/lang/en/suffix')).toEqual({ p: 'lang/en' })
    expect(pattern.match('/prefix/lang/fr/suffix')).toEqual({ p: 'lang/fr' })
    expect(() => pattern.match('/prefix/lang/de/suffix')).toThrow()
    expect(() => pattern.match('/prefix/lang/en/suffix/')).toThrow()
    expect(() => pattern.match('/prefix/lang/en')).toThrow()
    expect(() => pattern.match('/lang/en/suffix')).toThrow()
    expect(() => pattern.match('/prefix//suffix')).toThrow()

    expect(pattern.build({ p: 'lang/en' })).toBe('/prefix/lang/en/suffix')
    expect(pattern.build({ p: 'lang/fr' })).toBe('/prefix/lang/fr/suffix')

    // NOTE: the builder does not validate the param against the regex
    // maybe it should
    expect(() => pattern.build({ p: 'lang/de' })).not.toThrow()
    expect(() => pattern.build({ p: 'lang/fr/' })).not.toThrow()
  })

  it('can have a non capturing group in the regex', () => {
    const pattern = new MatcherPatternPathDynamic(
      // same as above but with multiple params, some encoded, other not
      /^\/(?:lang\/(en|fr))$/i,
      { p: [] },
      [['lang/', 1]]
    )

    expect(pattern.match('/lang/en')).toEqual({ p: 'en' })
    expect(pattern.match('/lang/fr')).toEqual({ p: 'fr' })
    expect(() => pattern.match('/lang/de')).toThrow()

    expect(pattern.build({ p: 'en' })).toBe('/lang/en')
    expect(pattern.build({ p: 'fr' })).toBe('/lang/fr')
  })

  it('can reject invalid param values with a custom param matcher', () => {
    const pattern = new MatcherPatternPathDynamic(
      /^\/(lang\/(en|fr))$/i,
      {
        p: [
          {
            get(value: string) {
              const v = value.toLowerCase().slice(5 /* 'lang/'.length */)
              if (v !== 'fr' && v !== 'en') {
                miss()
              }
              return v
            },
            set(value: 'fr' | 'en') {
              if (value !== 'fr' && value !== 'en') {
                miss()
              }
              return `lang/${value}`
            },
          },
        ],
      },
      // we don't encode the slash
      [0]
    )

    expect(pattern.match('/lang/en')).toEqual({ p: 'en' })
    expect(pattern.match('/lang/fr')).toEqual({ p: 'fr' })
    expect(() => pattern.match('/lang/de')).toThrow()

    expect(pattern.build({ p: 'en' })).toBe('/lang/en')
    expect(pattern.build({ p: 'fr' })).toBe('/lang/fr')
    expect(() =>
      pattern.build({
        // @ts-expect-error: not valid
        p: 'de',
      })
    ).toThrow()
  })

  describe('custom param parsers', () => {
    const doubleParser = defineParamParserRaw<number | null>({
      get: v => {
        const value = Number(v) * 2
        if (!Number.isFinite(value)) {
          miss()
        }
        return value
      },
      set: v => (v == null ? null : String(v / 2)),
    })

    const nullAwareParser = defineParamParserRaw<
      | 'was-null'
      | 'was-undefined'
      | `processed-${string}`
      // allow extra values that are impossible for tests
      | null
      | ''
    >({
      get: v => {
        if (v === null) return 'was-null'
        if (v === undefined) return 'was-undefined'
        return `processed-${v}`
      },
      set: v => (v === 'was-null' ? null : String(v).replace('processed-', '')),
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
      expect(pattern.build({ teamId: '' })).toBe('/teams')
      expect(pattern.build({ teamId: 'was-null' })).toBe('/teams')
      expect(pattern.build({ teamId: 'processed-world' })).toBe('/teams/world')
      // null is intentionally handled differently
      expect(pattern.build({ teamId: null })).toBe('/teams/null')
      expect('VUE_ROUTER_R0122').toHaveBeenWarnedTimes(1)
    })
  })
})
