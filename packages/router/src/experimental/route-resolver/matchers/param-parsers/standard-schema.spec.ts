import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { MatchMiss } from '../errors'
import { normalizeParamParser } from './standard-schema'

describe('normalizeParamParser', () => {
  it('passes through a ParamParser as-is', () => {
    const original = {
      get: (v: string) => Number(v),
      set: (v: number) => String(v),
    }
    const result = normalizeParamParser(original)
    expect(result).toBe(original)
  })

  it('wraps a standard schema', () => {
    const parser = normalizeParamParser(z.coerce.number())
    expect(parser.get?.('42')).toBe(42)
    expect(parser.set).toBeUndefined()
  })

  it('throws MatchMiss on validation failure', () => {
    const parser = normalizeParamParser(z.enum(['a', 'b']))
    expect(() => parser.get?.('x')).toThrow(MatchMiss)
  })
})
