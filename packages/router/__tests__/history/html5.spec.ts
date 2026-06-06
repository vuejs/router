/**
 * @vitest-environment happy-dom
 */
import { createWebHistory } from '../../src/history/html5'
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

  it('prepends the host to support // urls', () => {
    let history = createWebHistory()
    let spy = vi.spyOn(window.history, 'pushState')
    history.push('/foo')
    expect(spy).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      'http://localhost:3000/foo'
    )
    history.push('//foo')
    expect(spy).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.any(String),
      'http://localhost:3000//foo'
    )
    spy.mockRestore()
  })

  // https://github.com/vuejs/router/issues/2714
  describe('document URL with userinfo (HTTP basic auth)', () => {
    it('passes a relative URL to push/replaceState to avoid SecurityError', () => {
      getWindow().happyDOM.setURL('http://test:test@localhost:3000/')
      let history = createWebHistory()
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('/foo')
      // No absolute URL is constructed - the path resolves against the
      // current document origin, so the userinfo does not get re-anchored
      // and pushState does not throw SecurityError.
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '/foo'
      )
      spy.mockRestore()
    })

    it('still prepends the host for protocol-relative urls (// prefix)', () => {
      getWindow().happyDOM.setURL('http://test:test@localhost:3000/')
      let history = createWebHistory()
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('//foo')
      // // urls need the host prepended so the browser does not treat them
      // as protocol-relative cross-origin navigations.
      expect(spy).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.any(String),
        'http://localhost:3000//foo'
      )
      spy.mockRestore()
    })

    it('keeps existing behavior when document has no userinfo', () => {
      // baseline regression guard: the change must not affect the default
      // http(s) document URL path covered by the existing test above
      getWindow().happyDOM.setURL('http://localhost:3000/')
      let history = createWebHistory()
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('/foo')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        'http://localhost:3000/foo'
      )
      spy.mockRestore()
    })

    it('keeps existing behavior for file:// urls', () => {
      // file:// document urls must keep prepending the location even though
      // they cannot have userinfo - the user-info-only path is opt-in via
      // the userinfo guard.
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      let initialSpy = vi.spyOn(window.history, 'replaceState')
      let history = createWebHistory()
      initialSpy.mockRestore()
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('/foo')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        'file:///foo'
      )
      spy.mockRestore()
    })
  })

  describe('specific to base containing a hash', () => {
    it('calls push with hash part of the url with a base', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      let initialSpy = vi.spyOn(window.history, 'replaceState')
      let history = createWebHistory('#')
      // initial navigation
      expect(initialSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#/'
      )
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('/foo')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#/foo'
      )
      spy.mockRestore()
      initialSpy.mockRestore()
    })

    it('works with something after the hash in the base', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      let initialSpy = vi.spyOn(window.history, 'replaceState')
      let history = createWebHistory('#something')
      // initial navigation
      expect(initialSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#something/'
      )
      let spy = vi.spyOn(window.history, 'pushState')
      history.push('/foo')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#something/foo'
      )
      spy.mockRestore()
      initialSpy.mockRestore()
    })

    it('works with #! and on a file with initial location', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html#!/foo')
      let spy = vi.spyOn(window.history, 'replaceState')
      createWebHistory('#!')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#!/foo'
      )
      spy.mockRestore()
    })

    it('works with #other', () => {
      getWindow().happyDOM.setURL('file:///usr/etc/index.html')
      let spy = vi.spyOn(window.history, 'replaceState')
      createWebHistory('#other')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#other/'
      )
      spy.mockRestore()
    })

    it('works with custom#other in domain', () => {
      getWindow().happyDOM.setURL('https://esm.dev/custom')
      let spy = vi.spyOn(window.history, 'replaceState')
      createWebHistory('custom#other')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#other/'
      )
      spy.mockRestore()
    })

    it('works with #! and a host with initial location', () => {
      getWindow().happyDOM.setURL('https://esm.dev/#!/foo')
      let spy = vi.spyOn(window.history, 'replaceState')
      createWebHistory('/#!')
      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        '#!/foo'
      )
      spy.mockRestore()
    })
  })
})
