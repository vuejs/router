import { parseQuery } from '../src/query'
import { mockWarn } from 'jest-mock-warn'

describe('parseQuery', () => {
  mockWarn()

  it('works with leading ?', () => {
    expect(parseQuery('?foo=a')).toEqual({
      foo: 'a',
    })
  })

  it('works without leading ?', () => {
    expect(parseQuery('foo=a')).toEqual({
      foo: 'a',
    })
  })

  it('works with an empty string', () => {
    const emptyQuery = parseQuery('')
    expect(Object.keys(emptyQuery)).toHaveLength(0)
    expect(emptyQuery).toEqual({})
    expect(parseQuery('?')).toEqual({})
  })

  it('decodes values in query', () => {
    expect(parseQuery('e=%25')).toEqual({
      e: '%',
    })
  })

  it('parses empty string values', () => {
    expect(parseQuery('e=&c=a')).toEqual({
      e: '',
      c: 'a',
    })
  })

  it('decodes empty values as null', () => {
    expect(parseQuery('e&b&c=a')).toEqual({
      e: null,
      b: null,
      c: 'a',
    })
  })

  it('parses empty values as null in arrays', () => {
    expect(parseQuery('e&e&e=a')).toEqual({
      e: [null, null, 'a'],
    })
  })

  it('decodes array values in query', () => {
    expect(parseQuery('e=%25&e=%22')).toEqual({
      e: ['%', '"'],
    })
    expect(parseQuery('e=%25&e=a')).toEqual({
      e: ['%', 'a'],
    })
  })

  // this is for browsers like IE that allow invalid characters
  it('keep invalid values as is', () => {
    expect(parseQuery('e=%&e=%25')).toEqual({
      e: ['%', '%'],
    })

    expect('decoding "%"').toHaveBeenWarnedTimes(1)
  })
})
