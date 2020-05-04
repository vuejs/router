import { JSDOM } from 'jsdom'
import { createWebHashHistory } from '../../src/history/hash'
import { createWebHistory } from '../../src/history/html5'
import { createDom } from '../utils'

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

    it('should use a correct', () => {
      createWebHashHistory()
      expect(createWebHistory).toHaveBeenCalledWith('/#')
    })

    it('should be able to provide a base', () => {
      createWebHashHistory('/folder/')
      expect(createWebHistory).toHaveBeenCalledWith('/folder/#')
    })

    it('should be able to provide a base with no trailing slash', () => {
      createWebHashHistory('/folder')
      expect(createWebHistory).toHaveBeenCalledWith('/folder/#')
    })

    it('should read the base tag', () => {
      const baseEl = document.createElement('base')
      baseEl.href = '/foo/'
      document.head.appendChild(baseEl)
      createWebHashHistory()
      expect(createWebHistory).toHaveBeenCalledWith('/foo/#')
    })

    it('should use the base option over the base tag', () => {
      const baseEl = document.createElement('base')
      baseEl.href = '/foo/'
      document.head.appendChild(baseEl)
      createWebHashHistory('/bar/')
      expect(createWebHistory).toHaveBeenCalledWith('/bar/#')
    })
  })

  describe('file://', () => {
    beforeEach(() => {
      dom.reconfigure({ url: 'file:///usr/some-file.html' })
    })

    it('should use a correct base', () => {
      createWebHashHistory()
      // both, a trailing / and none work
      expect(createWebHistory).toHaveBeenCalledWith(
        expect.stringMatching(/^#\/?$/)
      )
    })
  })
})
