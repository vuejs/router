import { describe, expect, it } from 'vitest'
import { joinPath, trimExtension } from './utils'

describe('utils', () => {
  describe('trimExtension', () => {
    it('trims when found', () => {
      expect(trimExtension('foo.vue', ['.vue'])).toBe('foo')
      expect(trimExtension('foo.vue', ['.ts', '.vue'])).toBe('foo')
      expect(trimExtension('foo.ts', ['.ts', '.vue'])).toBe('foo')
      expect(trimExtension('foo.page.vue', ['.page.vue'])).toBe('foo')
    })

    it('skips if not found', () => {
      expect(trimExtension('foo.vue', ['.page.vue'])).toBe('foo.vue')
      expect(trimExtension('foo.page.vue', ['.vue'])).toBe('foo.page')
    })
  })

  describe('joinPath', () => {
    it('joins paths', () => {
      expect(joinPath('/foo', 'bar')).toBe('/foo/bar')
      expect(joinPath('/foo', 'bar', 'baz')).toBe('/foo/bar/baz')
      expect(joinPath('/foo', 'bar', 'baz', 'qux')).toBe('/foo/bar/baz/qux')
      expect(joinPath('/foo', 'bar', 'baz', 'qux', 'quux')).toBe(
        '/foo/bar/baz/qux/quux'
      )
    })

    it('adds a leading slash if missing', () => {
      expect(joinPath('foo')).toBe('/foo')
      expect(joinPath('foo', '')).toBe('/foo')
      expect(joinPath('foo', 'bar')).toBe('/foo/bar')
      expect(joinPath('foo', 'bar', 'baz')).toBe('/foo/bar/baz')
    })

    it('works with empty paths', () => {
      expect(joinPath('', '', '', '')).toBe('/')
      expect(joinPath('', '/', '', '')).toBe('/')
      expect(joinPath('', '/', '', '/')).toBe('/')
      expect(joinPath('', '/', '/', '/')).toBe('/')
      expect(joinPath('/', '', '', '')).toBe('/')
    })

    it('collapses slashes', () => {
      expect(joinPath('/foo/', 'bar')).toBe('/foo/bar')
      expect(joinPath('/foo', 'bar')).toBe('/foo/bar')
      expect(joinPath('/foo', 'bar/', 'foo')).toBe('/foo/bar/foo')
      expect(joinPath('/foo', 'bar', 'foo')).toBe('/foo/bar/foo')
    })

    it('keeps trailing slashes', () => {
      expect(joinPath('/foo', 'bar/')).toBe('/foo/bar/')
      expect(joinPath('/foo/', 'bar/')).toBe('/foo/bar/')
      expect(joinPath('/foo/', 'bar', 'baz/')).toBe('/foo/bar/baz/')
      expect(joinPath('/foo/', 'bar/', 'baz/')).toBe('/foo/bar/baz/')
    })
  })
})
