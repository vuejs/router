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

  it('keeps strings unchanged without a custom parser', () => {
    const hash = new MatcherPatternHashParam('fragment')
    expect(hash.match('#intro')).toEqual({ fragment: '#intro' })
    expect(hash.match('')).toEqual({ fragment: '' })
    expect(hash.build({ fragment: '#intro' })).toBe('#intro')
    expect(hash.build({ fragment: '' })).toBe('')
  })

  it('skips a route if a hash parser rejects the string', () => {
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
    expect(resolver.resolve('/page#other').name).toBe('fallback')
  })
})
