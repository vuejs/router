/**
 * @vitest-environment happy-dom
 */
import { createWebHistory } from '../../src/history/html5'
import { createWebHashHistory } from '../../src/history/hash'
import { mockWarn } from '../vitest-mock-warn'
import type { Window as HappyDomWindow } from 'happy-dom'
import { vi, describe, expect, it, beforeEach, afterEach } from 'vitest'

// to get a typed window
function getWindow(): HappyDomWindow {
  return window as unknown as HappyDomWindow
}

// override the value of isBrowser because the variable is created before happy-dom
// is created
vi.mock('../../src/utils/env', () => ({
  isBrowser: true,
}))

// These unit tests are supposed to tests very specific scenarios that are easier to setup
// on a unit test than an e2e tests
describe('History HTMl5', () => {
  beforeEach(() => {
    // empty the state to simulate an initial navigation by default
    window.history.replaceState(null, '', '')
  })

  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (let element of Array.from(document.getElementsByTagName('base')))
      element.remove()
  })

  it('handles a basic base', () => {
    expect(createWebHistory().base).toBe('')
    expect(createWebHistory('/').base).toBe('')
    expect(createWebHistory('/#').base).toBe('/#')
    expect(createWebHistory('#!').base).toBe('#!')
    expect(createWebHistory('#other').base).toBe('#other')
  })

  it('handles a base tag', () => {
    const baseEl = document.createElement('base')
    baseEl.href = '/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/foo')
  })

  it('handles a base tag with origin', () => {
    const baseEl = document.createElement('base')
    baseEl.href = 'https://example.com/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/foo')
  })

  it('handles a base tag with origin without trailing slash', () => {
    const baseEl = document.createElement('base')
    baseEl.href = 'https://example.com/bar'
    document.head.appendChild(baseEl)
    expect(createWebHistory().base).toBe('/bar')
  })

  it('ignores base tag if base is provided', () => {
    const baseEl = document.createElement('base')
    baseEl.href = '/foo/'
    document.head.appendChild(baseEl)
    expect(createWebHistory('/bar/').base).toBe('/bar')
  })

  it('handles a non-empty base', () => {
    expect(createWebHistory('/foo/').base).toBe('/foo')
    expect(createWebHistory('/foo').base).toBe('/foo')
  })

  it('handles a single hash base', () => {
    expect(createWebHistory('#').base).toBe('#')
    expect(createWebHistory('#/').base).toBe('#')
    expect(createWebHistory('#!/').base).toBe('#!')
    expect(createWebHistory('#other/').base).toBe('#other')
  })

  it('handles a non-empty hash base', () => {
    expect(createWebHistory('#/bar').base).toBe('#/bar')
    expect(createWebHistory('#/bar/').base).toBe('#/bar')
    expect(createWebHistory('#!/bar/').base).toBe('#!/bar')
    expect(createWebHistory('#other/bar/').base).toBe('#other/bar')
  })

  it('keeps // urls on the same origin', () => {
    getWindow().happyDOM.setURL('http://localhost:3000/')
    const history = createWebHistory()
    history.push('/foo')
    expect(location.href).toBe('http://localhost:3000/foo')
    history.push('//foo')
    expect(location.href).toBe('http://localhost:3000//foo')
    history.replace('//bar')
    expect(location.href).toBe('http://localhost:3000//bar')
  })

  it.each([
    ['/\\evil.com', 'http://localhost:3000//evil.com'],
    ['/\t/evil.com', 'http://localhost:3000//evil.com'],
    ['/\n/evil.com', 'http://localhost:3000//evil.com'],
    ['/\\\\evil.com', 'http://localhost:3000///evil.com'],
  ])('keeps %j on the same origin', (path, href) => {
    getWindow().happyDOM.setURL('http://localhost:3000/')
    const history = createWebHistory()
    history.push(path)
    expect(location.href).toBe(href)
    history.replace(path)
    expect(location.href).toBe(href)
  })

  it('keeps // urls on the same origin with a base', () => {
    getWindow().happyDOM.setURL('http://localhost:3000/app/')
    const history = createWebHistory('/app/')
    history.push('//foo')
    expect(location.href).toBe('http://localhost:3000/app//foo')
  })

  it('keeps // urls on the same origin on initial navigation', () => {
    getWindow().happyDOM.setURL('http://localhost:3000//invalid')
    const history = createWebHistory()
    expect(history.location).toBe('//invalid')
    expect(location.href).toBe('http://localhost:3000//invalid')
  })

  // #2714
  it('keeps the userinfo of the url', () => {
    getWindow().happyDOM.setURL('http://user:pass@localhost:3000/')
    const history = createWebHistory()
    expect(location.href).toBe('http://user:pass@localhost:3000/')
    history.push('/foo')
    expect(location.href).toBe('http://user:pass@localhost:3000/foo')
    history.replace('/bar?q=1#h')
    expect(location.href).toBe('http://user:pass@localhost:3000/bar?q=1#h')
    history.push('//foo')
    expect(location.href).toBe('http://user:pass@localhost:3000//foo')
  })

  it('keeps the userinfo of the url with a base', () => {
    getWindow().happyDOM.setURL('http://user:pass@localhost:3000/app/')
    const history = createWebHistory('/app/')
    history.push('/foo')
    expect(location.href).toBe('http://user:pass@localhost:3000/app/foo')
  })

  it('keeps the userinfo of the url with a base tag', () => {
    getWindow().happyDOM.setURL('http://user:pass@localhost:3000/app/')
    const baseEl = document.createElement('base')
    baseEl.href = '/app/'
    document.head.appendChild(baseEl)
    const history = createWebHistory()
    history.push('/foo')
    expect(location.href).toBe('http://user:pass@localhost:3000/app/foo')
  })

  describe('file:// protocol', () => {
    mockWarn()

    it('warns to use hash history', () => {
      getWindow().happyDOM.setURL('file:///app/index.html')
      createWebHistory()
      expect('VUE_ROUTER_R0127').toHaveBeenWarnedTimes(1)
    })

    it('does not warn with a hash base', () => {
      getWindow().happyDOM.setURL('file:///app/index.html')
      createWebHistory('#')
      createWebHashHistory()
      expect('VUE_ROUTER_R0127').not.toHaveBeenWarned()
    })

    it('does not warn on http', () => {
      getWindow().happyDOM.setURL('http://localhost:3000/')
      createWebHistory()
      expect('VUE_ROUTER_R0127').not.toHaveBeenWarned()
    })
  })

  describe('specific to base containing a hash', () => {
    it('writes the hash part of the url with a base', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      const history = createWebHistory('#')
      history.replace(history.location)
      expect(location.href).toBe('file:///usr/etc/index.html#/')
      history.push('/foo')
      expect(location.href).toBe('file:///usr/etc/index.html#/foo')
    })

    it('works with something after the hash in the base', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      const history = createWebHistory('#something')
      history.replace(history.location)
      expect(location.href).toBe('file:///usr/etc/index.html#something/')
      history.push('/foo')
      expect(location.href).toBe('file:///usr/etc/index.html#something/foo')
    })

    it('works with #! and on a file with initial location', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html#!/foo')
      const history = createWebHistory('#!')
      expect(history.location).toBe('/foo')
      history.replace(history.location)
      expect(location.href).toBe('file:///usr/etc/index.html#!/foo')
    })

    it('works with #other', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      const history = createWebHistory('#other')
      history.replace(history.location)
      expect(location.href).toBe('file:///usr/etc/index.html#other/')
    })

    it('works with custom#other in domain', () => {
      getWindow().happyDOM.setURL('https://esm.dev/custom')
      const history = createWebHistory('custom#other')
      history.replace(history.location)
      expect(location.href).toBe('https://esm.dev/custom#other/')
    })

    it('works with #! and a host with initial location', () => {
      getWindow().happyDOM.setURL('https://esm.dev/#!/foo')
      const history = createWebHistory('/#!')
      expect(history.location).toBe('/foo')
      history.replace(history.location)
      expect(location.href).toBe('https://esm.dev/#!/foo')
    })
  })
})
