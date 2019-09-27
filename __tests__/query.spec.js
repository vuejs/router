// @ts-check
const { parseQuery } = require('../src/history/utils')

describe('parseQuery', () => {
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
})
