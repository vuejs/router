import { describe, expect, it } from 'vitest'
import * as core from '../src'
import * as experimental from '../src/experimental'

// behavior is covered by encoding.spec.ts, this only checks each export
describe.each([
  { entry: 'vue-router', mod: core, hash: '%2525%20{' },
  // keeps pre-encoded sequences
  { entry: 'vue-router/experimental', mod: experimental, hash: '%25%20{' },
])('encoding helpers from $entry', ({ mod, hash }) => {
  it('exposes each helper', () => {
    const text = 'a b/c#d=e'
    expect(mod._encodePath(text)).toBe('a%20b/c%23d=e')
    expect(mod._encodeParam(text)).toBe('a%20b%2Fc%23d=e')
    expect(mod._encodeQueryValue(text)).toBe('a+b/c%23d=e')
    expect(mod._encodeQueryKey(text)).toBe('a+b/c%23d%3De')
    expect(mod._encodeHash('%25 {')).toBe(hash)
    expect(mod._decode('caf%C3%A9')).toBe('café')
  })
})
