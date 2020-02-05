import { parseQuery } from '../src/history/common'
import { mockWarn } from './mockWarn'

describe('parseQuery', () => {
  mockWarn()
  it('decodes values in query', () => {
    expect(parseQuery('e=%25')).toEqual({
      e: '%',
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
