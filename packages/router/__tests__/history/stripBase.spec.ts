/**
 * @vitest-environment happy-dom
 */
import { _stripBase, createWebHistory } from '../../src'
import { vi, describe, expect, it, afterEach } from 'vitest'

vi.mock('../../src/utils/env', () => ({
  isBrowser: true,
}))

describe('_stripBase', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  it.each([
    ['/app/', '/app/foo', '/foo'],
    ['/app/', '/app', '/'],
    ['/app/', '/app/', '/'],
    ['/app/', '/APP/foo', '/foo'],
    ['/app', '/App/foo/', '/foo/'],
    ['/', '/foo', '/foo'],
    ['', '/foo', '/foo'],
  ])(
    'with base %j, turns %j into the path read by the web history',
    (base, pathname, expected) => {
      window.history.replaceState(null, '', pathname)
      const history = createWebHistory(base)
      expect(_stripBase(location.pathname, history.base)).toBe(expected)
      expect(history.location).toBe(expected)
    }
  )

  it('keeps the pathname when the base is not at the beginning', () => {
    expect(_stripBase('/other/foo', '/app')).toBe('/other/foo')
  })

  it('inverts history.createHref for a non hash base', () => {
    const history = createWebHistory('/app/')
    expect(_stripBase(history.createHref('/foo?q=1'), history.base)).toBe(
      '/foo?q=1'
    )
    expect(_stripBase(history.createHref('/'), history.base)).toBe('/')
  })
})
