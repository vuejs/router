/**
 * @vitest-environment happy-dom
 */
import { createWebHashHistory } from '../../src/history/hash'
import { createWebHistory } from '../../src/history/html5'
import { mockWarn } from '../vitest-mock-warn'
import { Window as HappyDomWindow } from 'happy-dom'
import { vi, describe, expect, it, beforeEach, Mock, afterEach } from 'vitest'

// to get a typed window
function getWindow(): HappyDomWindow {
  return window as unknown as HappyDomWindow
}

vi.mock('../../src/history/html5')
// override the value of isBrowser because the variable is created before happy-dom
// is created
vi.mock('../../src/utils/env', () => ({
  isBrowser: true,
}))

describe('History Hash', () => {
  mockWarn()

  beforeEach(() => {
    ;(createWebHistory as Mock).mockClear()
  })

  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (let element of Array.from(document.getElementsByTagName('base')))
      element.remove()
  })

  describe('url', () => {
    beforeEach(() => {
      getWindow().happyDOM.setURL('https://example.com')
    })

    it('should use a correct base', () => {
      getWindow().happyDOM.setURL('https://esm.dev')
      createWebHashHistory()
      // starts with a `/`
      expect(createWebHistory).toHaveBeenCalledWith('/#')
    })

    it('warns if there is anything but a slash after the # in a provided base', () => {
      createWebHashHistory('/#/')
      createWebHashHistory('/#')
      createWebHashHistory('/base/#')
      expect('').not.toHaveBeenWarned()
      createWebHashHistory('/#/app')
      expect('should be "/#"').toHaveBeenWarned()
    })

    it('should be able to provide a base', () => {
      createWebHashHistory('/folder/')
      expect(createWebHistory).toHaveBeenCalledWith('/folder/#')
    })

    it('should be able to provide a base with no trailing slash', () => {
      createWebHashHistory('/folder')
      expect(createWebHistory).toHaveBeenCalledWith('/folder#')
    })

    it('should use the base option over the base tag', () => {
      const baseEl = document.createElement('base')
      baseEl.href = '/foo/'
      document.head.appendChild(baseEl)
      createWebHashHistory('/bar/')
      expect(createWebHistory).toHaveBeenCalledWith('/bar/#')
    })

    describe('url with pathname', () => {
      it('keeps the pathname as base', () => {
        getWindow().happyDOM.setURL('https://esm.dev/subfolder')
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#')
      })

      it('keeps the pathname without a trailing slash as base', () => {
        getWindow().happyDOM.setURL('https://esm.dev/subfolder#/foo')
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#')
      })

      it('keeps the pathname with trailing slash as base', () => {
        getWindow().happyDOM.setURL('https://esm.dev/subfolder/#/foo')
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder/#')
      })
    })
  })

  describe('file://', () => {
    beforeEach(() => {
      getWindow().happyDOM.setURL('file:///usr/some-file.html')
    })

    it('should use a correct base', () => {
      createWebHashHistory()
      // both, a trailing / and none work
      expect(createWebHistory).toHaveBeenCalledWith('#')
    })
  })
})
