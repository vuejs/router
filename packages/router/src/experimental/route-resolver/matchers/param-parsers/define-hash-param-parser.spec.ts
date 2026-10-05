import { describe, expect, it } from 'vitest'
import { defineHashParamParser, MatcherPatternHashParam } from '../../../index'

describe('defineHashParamParser', () => {
  const parser = defineHashParamParser<string[]>({
    get: value => value.split('/'),
    set: value => value.join('/'),
  })

  it('parses hash contents and empty strings', () => {
    expect(parser.get('intro/details')).toEqual(['intro', 'details'])
    expect(parser.get('')).toEqual([''])
  })

  it('serializes the parsed value as hash content', () => {
    expect(parser.set(['intro', 'details'])).toBe('intro/details')
    expect(parser.set([])).toBe('')
  })

  it('works with the hash matcher', () => {
    const hash = new MatcherPatternHashParam('sections', parser)
    expect(hash.match('')).toEqual({ sections: undefined })
    expect(hash.match('#')).toEqual({ sections: [''] })
    expect(hash.match('#intro/details')).toEqual({
      sections: ['intro', 'details'],
    })
    expect(hash.build({ sections: ['intro', 'details'] })).toBe(
      '#intro/details'
    )
    expect(hash.build({ sections: [] })).toBe('#')
  })
})
