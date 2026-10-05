import { describe, expect, it } from 'vitest'
import { MatcherPatternHashParam } from './matcher-pattern-hash'
import { MatcherPatternPathStatic } from './matcher-pattern'
import { createFixedResolver } from '../resolver-fixed'
import { miss } from './errors'

describe('hash param extraction', () => {
  const hash = new MatcherPatternHashParam('fragment', {
    get: value => ({
      hash: value,
      parts: value ? value.slice(1).split('/') : [],
    }),
    set: value => value.hash,
  })
  const resolver = createFixedResolver([
    { name: 'page', path: new MatcherPatternPathStatic('/page'), hash },
  ])

  it.each([
    ['', { fragment: { hash: '', parts: [] } }],
    ['#', { fragment: { hash: '#', parts: [''] } }],
    [
      '#one/two%20three',
      { fragment: { hash: '#one/two three', parts: ['one', 'two three'] } },
    ],
  ])('passes the whole hash %j to the parser', (fragment, params) => {
    expect(resolver.resolve(`/page${fragment}`).params).toEqual(params)
  })

  it('builds the full hash on named navigation and reparses the result', () => {
    const current = resolver.resolve({
      name: 'page',
      params: {
        fragment: { hash: '#one/two', parts: ['ignored'] },
      },
    })
    expect(current).toMatchObject({
      fullPath: '/page#one/two',
      params: { fragment: { hash: '#one/two', parts: ['one', 'two'] } },
    })
    expect(resolver.resolve({ params: {} }, current)).toMatchObject({
      fullPath: '/page#one/two',
      params: current.params,
    })
    expect(
      resolver.resolve(
        { params: { fragment: { hash: '', parts: [] } } },
        current
      )
    ).toMatchObject({
      fullPath: '/page',
      params: { fragment: { hash: '', parts: [] } },
    })
  })

  it('allows missing and null hash params during navigation', () => {
    const current = resolver.resolve({ name: 'page', params: {} })
    expect(current).toMatchObject({
      fullPath: '/page',
      params: { fragment: { hash: '', parts: [] } },
    })
    expect(
      resolver.resolve({ params: { fragment: null } }, current)
    ).toMatchObject({
      fullPath: '/page',
      params: current.params,
    })
  })

  it('normalizes nullish parser results to null', () => {
    const hash = new MatcherPatternHashParam('fragment', {
      get: () => undefined,
    })
    expect(hash.match('#intro')).toEqual({ fragment: null })
  })

  it('rejects required hashes without a default', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      {
        get: value => (value === '#allowed' ? value : miss()),
      },
      undefined,
      true
    )
    const resolver = createFixedResolver([
      { name: 'required', path: new MatcherPatternPathStatic('/page'), hash },
      { name: 'fallback', path: new MatcherPatternPathStatic('/page') },
    ])
    expect(resolver.resolve('/page#allowed').name).toBe('required')
    expect(resolver.resolve('/page#other').name).toBe('fallback')
    expect(resolver.resolve('/page').name).toBe('fallback')
    expect(() => resolver.resolve({ name: 'required', params: {} })).toThrow()
    const nullHash = new MatcherPatternHashParam(
      'fragment',
      {
        get: () => null,
      },
      undefined,
      true
    )
    expect(() => nullHash.match('#other')).toThrow()
  })

  it.each([false, true])(
    'uses a default for missing or rejected hashes (required: %s)',
    required => {
      const hash = new MatcherPatternHashParam(
        'fragment',
        {
          get: value => (value === '#allowed' ? value : miss()),
        },
        '#default',
        required
      )
      const resolver = createFixedResolver([
        { name: 'page', path: new MatcherPatternPathStatic('/page'), hash },
      ])
      expect(resolver.resolve('/page').params).toEqual({ fragment: '#default' })
      expect(resolver.resolve('/page#other').params).toEqual({
        fragment: '#default',
      })
      expect(resolver.resolve('/page#allowed').params).toEqual({
        fragment: '#allowed',
      })
      expect(resolver.resolve({ name: 'page', params: {} })).toMatchObject({
        fullPath: '/page',
        params: { fragment: '#default' },
      })
    }
  )

  it('uses the declared default when the hash is absent even if the getter accepts empty strings', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      {
        get: value => value || '#parser-default',
      },
      '#declared-default'
    )
    expect(hash.match('')).toEqual({ fragment: '#declared-default' })
    expect(hash.match('#valid')).toEqual({ fragment: '#valid' })
  })

  it('evaluates factory defaults on each miss and preserves successful falsy results', () => {
    const hash = new MatcherPatternHashParam(
      'fragment',
      {
        get: value => (value === '#valid' ? [] : undefined),
      },
      () => ['default'],
      true
    )
    const first = hash.match('')
    const second = hash.match('#invalid')
    expect(first).toEqual({ fragment: ['default'] })
    expect(second).toEqual(first)
    expect(second.fragment).not.toBe(first.fragment)
    expect(hash.match('#valid')).toEqual({ fragment: [] })
  })

  it('keeps strings unchanged without a custom parser', () => {
    const hash = new MatcherPatternHashParam('fragment')
    expect(hash.match('#intro')).toEqual({ fragment: '#intro' })
    expect(hash.match('')).toEqual({ fragment: null })
    expect(hash.build({ fragment: '#intro' })).toBe('#intro')
    expect(hash.build({ fragment: '' })).toBe('')
  })

  it('keeps the route with null if a hash parser rejects the string', () => {
    const resolver = createFixedResolver([
      {
        name: 'restricted',
        path: new MatcherPatternPathStatic('/page'),
        hash: new MatcherPatternHashParam('fragment', {
          get: value => (value === '#allowed' ? value : miss()),
        }),
      },
      { name: 'fallback', path: new MatcherPatternPathStatic('/page') },
    ])
    expect(resolver.resolve('/page#allowed').name).toBe('restricted')
    expect(resolver.resolve('/page#other')).toMatchObject({
      name: 'restricted',
      params: { fragment: null },
    })
    expect(resolver.resolve('/page')).toMatchObject({
      name: 'restricted',
      params: { fragment: null },
    })
    expect(resolver.resolve({ name: 'restricted', params: {} })).toMatchObject({
      name: 'restricted',
      fullPath: '/page',
      params: { fragment: null },
    })
  })
})
