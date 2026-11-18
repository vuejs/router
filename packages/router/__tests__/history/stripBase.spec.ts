/**
 * @vitest-environment happy-dom
 */
import { _stripBase, createWebHistory } from '../../src'
import { describe, expect, it } from 'vitest'

// plain stripBase cases are in location.spec.ts
describe('_stripBase', () => {
  it.each([
    ['/app/', '/app/foo'],
    ['/', '/foo'],
  ])('works with history.base for base %j', (base, pathname) => {
    window.history.replaceState(null, '', pathname)
    const history = createWebHistory(base)
    expect(_stripBase(location.pathname, history.base)).toBe(history.location)
  })
})
