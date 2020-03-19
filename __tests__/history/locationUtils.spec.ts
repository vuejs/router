import { stripBase } from '../../src/history/common'
import { createDom } from '../utils'

describe('History Location Utils', () => {
  beforeAll(() => {
    createDom()
  })

  describe('stripBase', () => {
    it('returns the pathname if no base', () => {
      expect(stripBase('', '')).toBe('')
      expect(stripBase('/', '')).toBe('/')
      expect(stripBase('/thing', '')).toBe('/thing')
    })

    it('returns the pathname without the base', () => {
      expect(stripBase('/base', '/base')).toBe('/')
      expect(stripBase('/base/', '/base')).toBe('/')
      expect(stripBase('/base/foo', '/base')).toBe('/foo')
    })
  })
})
