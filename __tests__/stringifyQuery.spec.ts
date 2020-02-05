import { stringifyQuery } from '../src/history/common'
import { mockWarn } from './mockWarn'

describe('stringifyQuery', () => {
  mockWarn()

  it('stringifies multiple values', () => {
    expect(stringifyQuery({ e: 'a', b: 'c' })).toEqual('e=a&b=c')
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
