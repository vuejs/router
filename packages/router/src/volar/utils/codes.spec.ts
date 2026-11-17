import { describe, expect, it } from 'vitest'
import type { Code } from '@vue/language-core'
import { replaceSourceRange, toString } from './codes'

describe('Volar code rewrites', () => {
  it('preserves source offsets and features across repeated insertions', () => {
    const features = { navigation: true }
    const codes: Code[] = ['prefix ', ['useRoute()', 'setup', 10, features]]

    replaceSourceRange(codes, 'setup', 18, 18, '<Route>')
    replaceSourceRange(codes, 'setup', 10, 10, '(')
    replaceSourceRange(codes, 'setup', 20, 20, ')')

    expect(toString(codes)).toBe('prefix (useRoute<Route>())')
    expect(codes.filter(code => typeof code !== 'string')).toEqual([
      ['useRoute', 'setup', 10, features],
      ['()', 'setup', 18, features],
    ])
  })

  it('leaves other sources untouched', () => {
    const codes: Code[] = [['useRoute()', 'other', 0, {}]]
    replaceSourceRange(codes, 'setup', 8, 8, '<Route>')
    expect(toString(codes)).toBe('useRoute()')
  })
})
