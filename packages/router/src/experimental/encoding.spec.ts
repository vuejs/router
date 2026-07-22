import { describe, expect, it } from 'vitest'
import { encodeHash } from './encoding'

describe('encodeHash', () => {
  it('protects characters that cannot appear in a URL', () => {
    expect(encodeHash('#a b')).toBe('#a%20b')
    expect(encodeHash('#"<>`')).toBe('#%22%3C%3E%60')
    expect(encodeHash('#\\')).toBe('#%5C')
    expect(encodeHash('#café ¶')).toBe('#caf%C3%A9%20%C2%B6')
  })

  it('keeps percent encoded sequences as they are', () => {
    expect(encodeHash('#%26')).toBe('#%26')
    expect(encodeHash('#a=b%26c&d=e')).toBe('#a=b%26c&d=e')
    expect(encodeHash('#caf%C3%A9')).toBe('#caf%C3%A9')
    // double encoded stays double encoded
    expect(encodeHash('#%2526')).toBe('#%2526')
  })

  it('keeps a lone % as it is like browsers do', () => {
    expect(encodeHash('#100%')).toBe('#100%')
    expect(encodeHash('#50% off')).toBe('#50%%20off')
  })

  it('keeps reserved and sub-delimiter characters as they are', () => {
    expect(encodeHash('#a&b=c?d/e:f@g')).toBe('#a&b=c?d/e:f@g')
    expect(encodeHash("#!$'()*+,;")).toBe("#!$'()*+,;")
    expect(encodeHash('#{}^|[]')).toBe('#{}^|[]')
  })

  it('is idempotent', () => {
    for (const hash of [
      '#a b',
      '#"<>`',
      '#café ¶',
      '#%26',
      '#100%',
      '#50% off',
      '#a=b%26c&d=e',
      '#{}^|[]',
      '#Hell 20% of es¶ña',
    ]) {
      const once = encodeHash(hash)
      expect(encodeHash(once)).toBe(once)
    }
  })
})
