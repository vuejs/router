import { stringifyQuery } from '../src/history/common'
import { mockWarn } from './mockWarn'

describe('stringifyQuery', () => {
  mockWarn()

  it('stringifies multiple values', () => {
    expect(stringifyQuery({ e: 'a', b: 'c' })).toEqual('e=a&b=c')
  })

  it('stringifies null values', () => {
    expect(stringifyQuery({ e: null })).toEqual('e')
    expect(stringifyQuery({ e: null, b: null })).toEqual('e&b')
  })

  it('stringifies null values in arrays', () => {
    expect(stringifyQuery({ e: [null] })).toEqual('e')
    expect(stringifyQuery({ e: [null, 'c'] })).toEqual('e&e=c')
  })

  it('stringifies numbers', () => {
    expect(stringifyQuery({ e: 2 })).toEqual('e=2')
    expect(stringifyQuery({ e: [2, 'b'] })).toEqual('e=2&e=b')
  })

  it('ignores undefined values', () => {
    expect(stringifyQuery({ e: undefined })).toEqual('')
    expect(stringifyQuery({ e: undefined, b: 'a' })).toEqual('b=a')
  })

  it('stringifies arrays', () => {
    expect(stringifyQuery({ e: ['b', 'a'] })).toEqual('e=b&e=a')
  })

  it('encodes values', () => {
    expect(stringifyQuery({ e: '%', b: 'c' })).toEqual('e=%25&b=c')
  })

  it('encodes values in arrays', () => {
    expect(stringifyQuery({ e: ['%', 'a'], b: 'c' })).toEqual('e=%25&e=a&b=c')
  })
})
