import { describe, expect, it } from 'vitest'
import {
  _decode,
  _encodeHash,
  _encodeParam,
  _encodePath,
  _encodeQueryKey,
  _encodeQueryValue,
} from '../src'
import { mockWarn } from './vitest-mock-warn'

describe('encoding helpers from the public entry', () => {
  mockWarn()

  describe('_encodePath', () => {
    it('encodes non ASCII and spaces', () => {
      expect(_encodePath('/café/a b')).toBe('/caf%C3%A9/a%20b')
    })

    it('encodes # and ? but keeps / and sub-delimiters', () => {
      expect(_encodePath('/a#b?c/d&e+f=g')).toBe('/a%23b%3Fc/d&e+f=g')
    })

    it('keeps | [ ] literal', () => {
      expect(_encodePath('/a|b[c]')).toBe('/a|b[c]')
    })

    it('encodes % so encoded input is encoded again', () => {
      expect(_encodePath('/a%2Fb')).toBe('/a%252Fb')
      expect(_encodePath('/100%')).toBe('/100%25')
    })

    it('handles nullish and numbers', () => {
      expect(_encodePath(null)).toBe('')
      expect(_encodePath(undefined)).toBe('')
      expect(_encodePath(0)).toBe('0')
    })
  })

  it('_encodeParam also encodes /', () => {
    expect(_encodeParam('a/b#c')).toBe('a%2Fb%23c')
    expect(_encodeParam(null)).toBe('')
  })

  it('_encodeQueryValue encodes space as + and escapes + & #', () => {
    expect(_encodeQueryValue('a b+c&d#e=f')).toBe('a+b%2Bc%26d%23e=f')
    expect(_encodeQueryValue(0)).toBe('0')
  })

  it('_encodeQueryKey also encodes =', () => {
    expect(_encodeQueryKey('a=b c')).toBe('a%3Db+c')
  })

  it('_encodeHash keeps # { } ^ and encodes spaces', () => {
    expect(_encodeHash('#a {b}^ c')).toBe('#a%20{b}^%20c')
  })

  describe('_decode', () => {
    it('decodes percent-encoded text', () => {
      expect(_decode('caf%C3%A9%2F')).toBe('café/')
      expect(_decode(1)).toBe('1')
      expect(_decode(null)).toBe(null)
    })

    it('returns the original text and warns on malformed input', () => {
      expect(_decode('%E0%A4%A')).toBe('%E0%A4%A')
      expect('Error decoding "%E0%A4%A"').toHaveBeenWarned()
    })
  })
})
