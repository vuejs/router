import { describe, expect, it } from 'vitest'
import { MatcherPatternHashParam } from './matcher-pattern-hash'
import { MatcherPatternPathStatic } from './matcher-pattern'
import { createFixedResolver } from '../resolver-fixed'
import { MatchMiss, miss } from './errors'
import { PARAM_PARSER_BOOL, PARAM_PARSER_INT } from './param-parsers'

describe('hash param extraction', () => {
  const hash = new MatcherPatternHashParam('fragment', {
    get: value => ({ parts: value.split('/') }),
    set: value => value.parts.join('/'),
  })
  const resolver = createFixedResolver([
    { name: 'page', path: new MatcherPatternPathStatic('/page'), hash },
  ])

  it('leaves an absent hash undefined', () => {
    expect(resolver.resolve('/page').params).toEqual({ fragment: undefined })
  })

  it('parses a bare hash sign as an empty string', () => {
    expect(resolver.resolve('/page#').params).toEqual({
      fragment: { parts: [''] },
    })
  })

  it('parses the decoded content after the first hash sign', () => {
    expect(resolver.resolve('/page#one/two%20three').params).toEqual({
      fragment: { parts: ['one', 'two three'] },
    })
    expect(resolver.resolve('/page##intro').params).toEqual({
      fragment: { parts: ['#intro'] },
    })
  })

  it('builds and reparses named navigation', () => {
    const current = resolver.resolve({
      name: 'page',
      params: { fragment: { parts: ['one', 'two three'] } },
    })
    expect(current).toMatchObject({
      fullPath: '/page#one/two%20three',
      params: { fragment: { parts: ['one', 'two three'] } },
    })
    expect(resolver.resolve({ params: {} }, current)).toMatchObject({
      fullPath: current.fullPath,
      params: current.params,
    })
    expect(
      resolver.resolve({ params: { fragment: { parts: [''] } } }, current)
    ).toMatchObject({
      fullPath: '/page#',
      params: { fragment: { parts: [''] } },
    })
    expect(
      resolver.resolve({ params: { fragment: undefined } }, current)
    ).toMatchObject({
      fullPath: '/page',
      params: { fragment: undefined },
    })
  })

  it('encodes the hash built from params', () => {
    const location = resolver.resolve({
      name: 'page',
      params: { fragment: { parts: ['a b', '"<>`', 'café', '50%'] } },
    })
    expect(location.hash).toBe('#a%20b/%22%3C%3E%60/caf%C3%A9/50%25')
    expect(location.fullPath).toBe('/page' + location.hash)
    expect(location.params).toEqual({
      fragment: { parts: ['a b', '"<>`', 'café', '50%'] },
    })
  })

  it('round trips values with a percent sign', () => {
    const current = resolver.resolve({
      name: 'page',
      params: { fragment: { parts: ['50%', '%20'] } },
    })
    expect(current.fullPath).toBe('/page#50%25/%2520')
    expect(resolver.resolve('/page#50%25/%2520').params).toEqual({
      fragment: { parts: ['50%', '%20'] },
    })
  })

  it('uses the default for an absent hash without calling the getter', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      { get: () => 'parsed' },
      'default'
    )
    expect(hash.match('')).toEqual({ fragment: 'default' })
    expect(hash.match('#')).toEqual({ fragment: 'parsed' })
  })

  it('rejects an absent required hash even if the parser accepts empty strings', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      { get: () => 'parsed' },
      undefined,
      true
    )
    expect(() => hash.match('')).toThrow(MatchMiss)
    expect(hash.match('#')).toEqual({ fragment: 'parsed' })
  })

  it.each(['', null, false, 0, 0n, NaN])(
    'preserves the parsed value %s with a default or required option',
    value => {
      const parser = { get: () => value }
      const optional = new MatcherPatternHashParam('fragment', parser)
      const required = new MatcherPatternHashParam(
        'fragment',
        parser,
        undefined,
        true
      )
      const withDefault = new MatcherPatternHashParam(
        'fragment',
        parser,
        () => {
          throw new Error('Default must not run')
        }
      )
      expect(optional.match('#value')).toEqual({ fragment: value })
      expect(required.match('#value')).toEqual({ fragment: value })
      expect(withDefault.match('#value')).toEqual({ fragment: value })
    }
  )

  it('uses defaults only for missing, undefined, or rejected values', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      {
        get: value =>
          value === 'invalid'
            ? miss()
            : value === 'undefined'
              ? undefined
              : value,
      },
      'default'
    )
    for (const input of ['', '#invalid', '#undefined']) {
      expect(hash.match(input)).toEqual({ fragment: 'default' })
    }
    expect(hash.match('#')).toEqual({ fragment: '' })
    expect(hash.match('#value')).toEqual({ fragment: 'value' })
  })

  it('creates a fresh default for each missing or rejected hash', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      { get: (value): string[] => (value === 'valid' ? [] : miss()) },
      () => ['default']
    )
    const first = hash.match('')
    expect(first).toEqual({ fragment: ['default'] })
    for (const input of ['', '#invalid']) {
      const next = hash.match(input)
      expect(next).toEqual(first)
      expect(next.fragment).not.toBe(first.fragment)
    }
    expect(hash.match('#valid')).toEqual({ fragment: [] })
  })

  it('leaves parser errors and undefined results undefined when optional', () => {
    const hash = new MatcherPatternHashParam('fragment', {
      get: value => (value ? miss() : undefined),
    })
    expect(hash.match('#')).toEqual({ fragment: undefined })
    expect(hash.match('#invalid')).toEqual({ fragment: undefined })
  })

  it('preserves parser errors when required', () => {
    const error = new Error('Invalid fragment')
    const hash = new MatcherPatternHashParam(
      'fragment',
      {
        get: () => {
          throw error
        },
      },
      undefined,
      true
    )
    expect(() => hash.match('#invalid')).toThrow(error)
  })

  it('rejects undefined results when required', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      { get: () => undefined },
      undefined,
      true
    )
    expect(() => hash.match('#')).toThrow(MatchMiss)
  })

  it('matches a required bare hash but rejects an absent hash', () => {
    const hash = new MatcherPatternHashParam('fragment', {}, undefined, true)
    const resolver = createFixedResolver([
      { name: 'required', path: new MatcherPatternPathStatic('/page'), hash },
      { name: 'fallback', path: new MatcherPatternPathStatic('/page') },
    ])
    expect(resolver.resolve('/page#')).toMatchObject({
      name: 'required',
      params: { fragment: '' },
    })
    expect(resolver.resolve('/page').name).toBe('fallback')
    expect(() => resolver.resolve({ name: 'required', params: {} })).toThrow(
      MatchMiss
    )
  })

  it('uses null as an explicit default', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      { get: value => (value === 'invalid' ? miss() : value) },
      null
    )
    expect(hash.match('')).toEqual({ fragment: null })
    expect(hash.match('#invalid')).toEqual({ fragment: null })
    expect(hash.match('#')).toEqual({ fragment: '' })
  })

  it.each([{}, { fragment: null }, { fragment: undefined }])(
    'clears a nullish param without invoking the setter: %s',
    params => {
      const hash = new MatcherPatternHashParam(
        'fragment',
        {
          set: () => 'serialized',
        },
        null
      )
      expect(hash.build(params)).toBe('')
    }
  )

  it.each([null, undefined])(
    'clears the hash when the serializer returns %s',
    value => {
      const hash = new MatcherPatternHashParam('fragment', {
        set: (_value: string) => value,
      })
      expect(hash.build({ fragment: 'clear' })).toBe('')
    }
  )

  it('uses the content as a string without a custom parser', () => {
    const hash = new MatcherPatternHashParam('fragment')
    expect(hash.match('')).toEqual({ fragment: undefined })
    expect(hash.match('#')).toEqual({ fragment: '' })
    expect(hash.match('#intro')).toEqual({ fragment: 'intro' })
    expect(hash.build({ fragment: 'intro' })).toBe('#intro')
    expect(hash.build({ fragment: '' })).toBe('#')
    expect(hash.build({ fragment: '#intro' })).toBe('##intro')
  })

  it('uses the native integer parser in both directions', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      PARAM_PARSER_INT,
      undefined,
      true
    )
    expect(hash.match('#0')).toEqual({ fragment: 0 })
    expect(hash.match('#42')).toEqual({ fragment: 42 })
    expect(hash.build({ fragment: 0 })).toBe('#0')
    expect(() => hash.match('#')).toThrow(MatchMiss)
  })

  it('uses the native boolean parser in both directions', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      PARAM_PARSER_BOOL,
      undefined,
      true
    )
    expect(hash.match('#false')).toEqual({ fragment: false })
    expect(hash.match('#true')).toEqual({ fragment: true })
    expect(hash.build({ fragment: false })).toBe('#false')
  })

  it('preserves parser method receivers', () => {
    const parser = {
      prefix: 'section-',
      get(value: string) {
        return value.slice(this.prefix.length)
      },
      set(value: string) {
        return this.prefix + value
      },
    }
    const hash = new MatcherPatternHashParam('fragment', parser)
    expect(hash.match('#section-intro')).toEqual({ fragment: 'intro' })
    expect(hash.build({ fragment: 'intro' })).toBe('#section-intro')
  })
})
