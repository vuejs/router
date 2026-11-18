/**
 * @vitest-environment happy-dom
 */
import { _stripBase, createWebHistory } from '../../src'
import { describe, expect, it, afterEach } from 'vitest'

// plain stripBase cases are in location.spec.ts
describe('_stripBase', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it.each([
    ['/app/', '/app', '/'],
    ['/app/', '/APP/foo', '/foo'],
    ['/', '/foo', '/foo'],
  ])(
    'with base %j, turns %j into the path read by the web history',
    (base, pathname, expected) => {
      window.history.replaceState(null, '', pathname)
      const history = createWebHistory(base)
      expect(_stripBase(location.pathname, history.base)).toBe(expected)
      expect(history.location).toBe(expected)
    }
  )

  it('inverts history.createHref for a non hash base', () => {
    const history = createWebHistory('/app/')
    expect(_stripBase(history.createHref('/foo?q=1'), history.base)).toBe(
      '/foo?q=1'
    )
  })
})
