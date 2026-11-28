import { describe, expect, it } from 'vitest'
import { parseClassicPath } from './matcher-pattern-path-classic'
import {
  MatcherPatternPathDynamic,
  MatcherPatternPathStatic,
} from './matcher-pattern'
import { mockWarn } from '../../../../__tests__/vitest-mock-warn'

describe('parseClassicPath', () => {
  mockWarn()

  it('parses static paths', () => {
    const pattern = parseClassicPath('/users/list')
    expect(pattern).toBeInstanceOf(MatcherPatternPathStatic)
    expect(pattern.match('/users/list')).toEqual({})
    expect(pattern.match('/Users/List')).toEqual({})
    expect(pattern.match('/users')).toBeNull()
    expect(pattern.match('/users/list/')).toBeNull()
    expect(pattern.build({})).toBe('/users/list')
  })

  it('parses the root path', () => {
    expect(parseClassicPath('/').match('/')).toEqual({})
    expect(parseClassicPath('').match('/')).toEqual({})
    expect(parseClassicPath('/').build({})).toBe('/')
  })

  it('matches case sensitively with caseSensitive', () => {
    const options = { caseSensitive: true }
    expect(parseClassicPath('/users', options).match('/Users')).toBeNull()
    expect(parseClassicPath('/users/:id', options).match('/Users/1')).toBeNull()
    expect(parseClassicPath('/users/:id', options).match('/users/1')).toEqual({
      id: '1',
    })
  })

  it('ignores a trailing slash in the parsed path', () => {
    expect(parseClassicPath('/users/').match('/users')).toEqual({})
    expect(parseClassicPath('/users/:id/').match('/users/1')).toEqual({
      id: '1',
    })
  })

  describe('trailingSlash: always', () => {
    const options = { trailingSlash: 'always' } as const

    it('requires a trailing slash', () => {
      const pattern = parseClassicPath('/users', options)
      expect(pattern.match('/users/')).toEqual({})
      expect(pattern.match('/users')).toBeNull()
      expect(pattern.build({})).toBe('/users/')

      const dynamic = parseClassicPath('/users/:id', options)
      expect(dynamic.match('/users/1/')).toEqual({ id: '1' })
      expect(dynamic.match('/users/1')).toBeNull()
      expect(dynamic.build({ id: '1' })).toBe('/users/1/')
    })

    it('matches / when all the params are optional', () => {
      const pattern = parseClassicPath('/:a?/:b*', options)
      expect(pattern.match('/')).toEqual({ a: null, b: [] })
      expect(pattern.match('/1/2/')).toEqual({ a: '1', b: ['2'] })
      expect(pattern.match('/1')).toBeNull()
      expect(pattern.build({ a: '1', b: [] })).toBe('/1/')
    })

    it('keeps the root path', () => {
      expect(parseClassicPath('/', options).match('/')).toEqual({})
      expect(parseClassicPath('/', options).build({})).toBe('/')
    })
  })

  describe('trailingSlash: ignore', () => {
    const options = { trailingSlash: 'ignore' } as const

    it('matches with and without a trailing slash', () => {
      const pattern = parseClassicPath('/users', options)
      expect(pattern.match('/users')).toEqual({})
      expect(pattern.match('/users/')).toEqual({})
      expect(pattern.build({})).toBe('/users')

      const dynamic = parseClassicPath('/users/:id', options)
      expect(dynamic.match('/users/1')).toEqual({ id: '1' })
      expect(dynamic.match('/users/1/')).toEqual({ id: '1' })
      expect(dynamic.build({ id: '1' })).toBe('/users/1')
    })

    it('keeps the root path', () => {
      expect(parseClassicPath('/', options).match('/')).toEqual({})
    })
  })

  it('lets a trailing splat match any trailing slash', () => {
    for (const trailingSlash of ['always', 'never', 'ignore'] as const) {
      const pattern = parseClassicPath('/:pathMatch(.*)', { trailingSlash })
      expect(pattern.match('/a/')).toEqual({ pathMatch: 'a/' })
      expect(pattern.match('/a')).toEqual({ pathMatch: 'a' })
      expect(pattern.build({ pathMatch: 'a' })).toBe('/a')
    }
  })

  it('parses params', () => {
    const pattern = parseClassicPath('/users/:id')
    expect(pattern).toBeInstanceOf(MatcherPatternPathDynamic)
    expect(pattern.match('/users/1')).toEqual({ id: '1' })
    expect(pattern.match('/users/1/')).toBeNull()
    expect(pattern.match('/users')).toBeNull()
    expect(pattern.match('/users/a/b')).toBeNull()
    expect(pattern.build({ id: 'a b' })).toBe('/users/a%20b')
  })

  it('parses params with a custom regexp', () => {
    const pattern = parseClassicPath('/users/:id(\\d+)')
    expect(pattern.match('/users/1')).toEqual({ id: '1' })
    expect(pattern.match('/users/a')).toBeNull()
  })

  it('parses optional params', () => {
    const pattern = parseClassicPath('/users/:id?')
    expect(pattern.match('/users')).toEqual({ id: null })
    expect(pattern.match('/users/1')).toEqual({ id: '1' })
    expect(pattern.match('/users/')).toBeNull()
    expect(pattern.build({ id: null })).toBe('/users')
    expect(pattern.build({ id: '1' })).toBe('/users/1')
  })

  it('matches / when all the params are optional', () => {
    const pattern = parseClassicPath('/:a?/:b*')
    expect(pattern.match('/')).toEqual({ a: null, b: [] })
    expect(pattern.match('/1')).toEqual({ a: '1', b: [] })
    expect(pattern.match('/1/2/3')).toEqual({ a: '1', b: ['2', '3'] })
    expect(pattern.match('/1/')).toBeNull()
    expect(pattern.build({ a: null, b: [] })).toBe('/')
    expect(pattern.build({ a: '1', b: ['2', '3'] })).toBe('/1/2/3')
  })

  it('parses repeatable params', () => {
    const pattern = parseClassicPath('/files/:ids+')
    expect(pattern.match('/files')).toBeNull()
    expect(pattern.match('/files/1')).toEqual({ ids: ['1'] })
    expect(pattern.match('/files/1/2')).toEqual({ ids: ['1', '2'] })
    expect(pattern.build({ ids: ['1', '2'] })).toBe('/files/1/2')

    const custom = parseClassicPath('/files/:ids(\\d+)+')
    expect(custom.match('/files/1/2')).toEqual({ ids: ['1', '2'] })
    expect(custom.match('/files/1/a')).toBeNull()
  })

  it('parses optional repeatable params', () => {
    const pattern = parseClassicPath('/files/:ids*')
    expect(pattern.match('/files')).toEqual({ ids: [] })
    expect(pattern.match('/files/1/2')).toEqual({ ids: ['1', '2'] })
    expect(pattern.build({ ids: [] })).toBe('/files')
  })

  it('parses splat params', () => {
    const pattern = parseClassicPath('/:pathMatch(.*)')
    expect(pattern.match('/')).toEqual({ pathMatch: '' })
    expect(pattern.match('/a/b/')).toEqual({ pathMatch: 'a/b/' })
    expect(pattern.build({ pathMatch: 'a/b' })).toBe('/a/b')
    expect(pattern.build({ pathMatch: '' })).toBe('/')
  })

  it('parses repeatable splat params', () => {
    const pattern = parseClassicPath('/:pathMatch(.*)*')
    expect(pattern.match('/')).toEqual({ pathMatch: [] })
    expect(pattern.match('/a/b')).toEqual({ pathMatch: ['a', 'b'] })
    expect(pattern.build({ pathMatch: ['a', 'b'] })).toBe('/a/b')
    expect(pattern.build({ pathMatch: [] })).toBe('/')
  })

  it('parses sub segments', () => {
    const pattern = parseClassicPath('/users/:id-:other.png')
    expect(pattern.match('/users/1-2.png')).toEqual({ id: '1', other: '2' })
    expect(pattern.match('/users/1-2.jpg')).toBeNull()
    expect(pattern.build({ id: '1', other: '2' })).toBe('/users/1-2.png')

    const optional = parseClassicPath('/:lang?-static')
    expect(optional.match('/-static')).toEqual({ lang: null })
    expect(optional.match('/en-static')).toEqual({ lang: 'en' })
  })

  it('escapes special characters in static parts', () => {
    const pattern = parseClassicPath('/a.b/:id')
    expect(pattern.match('/a.b/1')).toEqual({ id: '1' })
    expect(pattern.match('/axb/1')).toBeNull()
  })

  it('throws on relative paths', () => {
    expect(() => parseClassicPath('users')).toThrow()
  })

  it('warns about duplicated params', () => {
    parseClassicPath('/:id/:id')
    expect('VUE_ROUTER_R0090').toHaveBeenWarned()
  })
})
