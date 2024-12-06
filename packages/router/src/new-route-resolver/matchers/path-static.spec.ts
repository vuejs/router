import { describe, expect, it } from 'vitest'
import { MatcherPathStatic } from './path-static'

describe('PathStaticMatcher', () => {
  it('matches', () => {
    expect(new MatcherPathStatic('/').match('/')).toEqual({})
    expect(() => new MatcherPathStatic('/').match('/no')).toThrowError()
    expect(new MatcherPathStatic('/ok/ok').match('/ok/ok')).toEqual({})
    expect(() => new MatcherPathStatic('/ok/ok').match('/ok/no')).toThrowError()
  })

  it('builds path', () => {
    expect(new MatcherPathStatic('/').buildPath()).toBe('/')
    expect(new MatcherPathStatic('/ok').buildPath()).toBe('/ok')
    expect(new MatcherPathStatic('/ok/ok').buildPath()).toEqual('/ok/ok')
  })
})
