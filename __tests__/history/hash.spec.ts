import { JSDOM } from 'jsdom'
import { createWebHashHistory } from '../../src/history/hash'
import { createWebHistory } from '../../src/history/html5'
import { createDom } from '../utils'
import { mockWarn } from 'jest-mock-warn'

jest.mock('../../src/history/html5')
// override the value of isBrowser because the variable is created before JSDOM
// is created
jest.mock('../../src/utils/env', () => ({
  isBrowser: true,
}))

describe('History Hash', () => {
  let dom: JSDOM
  beforeAll(() => {
    dom = createDom()
  })
  mockWarn()

  beforeEach(() => {
    ;(createWebHistory as jest.Mock).mockClear()
  })

  afterAll(() => {
    dom.window.close()
  })

  afterEach(() => {
    // ensure no base element is left after a test as only the first is
    // respected
    for (let element of Array.from(document.getElementsByTagName('base')))
      element.remove()
  })

  describe('url', () => {
    beforeEach(() => {
      dom.reconfigure({ url: 'https://example.com' })
    })

    it('should use a correct base', () => {
      dom.reconfigure({ url: 'https://esm.dev' })
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
        dom.reconfigure({ url: 'https://esm.dev/subfolder' })
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#')
      })

      it('keeps the pathname without a trailing slash as base', () => {
        dom.reconfigure({ url: 'https://esm.dev/subfolder#/foo' })
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder#')
      })

      it('keeps the pathname with trailing slash as base', () => {
        dom.reconfigure({ url: 'https://esm.dev/subfolder/#/foo' })
        createWebHashHistory()
        expect(createWebHistory).toHaveBeenCalledWith('/subfolder/#')
      })
    })
  })

  describe('file://', () => {
    beforeEach(() => {
      dom.reconfigure({ url: 'file:///usr/some-file.html' })
    })

    it('should use a correct base', () => {
      createWebHashHistory()
      // both, a trailing / and none work
      expect(createWebHistory).toHaveBeenCalledWith('#')
    })
  })
})
