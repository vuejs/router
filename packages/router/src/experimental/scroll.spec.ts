/**
 * @vitest-environment happy-dom
 */
import {
  SCROLL_RESTORATION_CAPTURE_DEFAULT as capture,
  SCROLL_RESTORATION_RESTORE_DEFAULT as restore,
} from './scroll-restoration'
import { mockWarn } from '../../__tests__/vitest-mock-warn'
import {
  vi,
  describe,
  expect,
  it,
  beforeEach,
  afterAll,
  beforeAll,
} from 'vitest'

describe('scroll', () => {
  mockWarn()

  describe('capture', () => {
    let initialScrollRestoration: ScrollRestoration
    const scrollXMock = vi.spyOn(window, 'scrollX', 'get').mockReturnValue(10)
    const scrollYMock = vi.spyOn(window, 'scrollY', 'get').mockReturnValue(100)

    beforeAll(() => {
      initialScrollRestoration = history.scrollRestoration
    })

    beforeEach(() => {
      scrollXMock.mockClear()
      scrollYMock.mockClear()
    })

    afterAll(() => {
      history.scrollRestoration = initialScrollRestoration
      scrollXMock.mockRestore()
      scrollYMock.mockRestore()
    })

    describe('SCROLL_RESTORATION_CAPTURE_DEFAULT', () => {
      it('captures the current scroll position when scrollRestoration is manual', () => {
        history.scrollRestoration = 'manual'
        expect(capture()).toEqual({ default: { left: 10, top: 100 } })
      })

      it('returns null when scrollRestoration is auto', () => {
        history.scrollRestoration = 'auto'
        expect(capture()).toBe(null)
      })
    })
  })

  describe('restore', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="text"><div class="container"></div></div>
        <div data-scroll="true"></div>
        <div id="special~characters"></div>
      `
      window.scrollTo({ left: 50, top: 60 })
    })

    it.each([
      [{ left: 10, top: 100 }, 10, 100],
      [{ top: 10 }, 50, 10],
      [{ left: 10 }, 10, 60],
      [{ left: 10, top: 100, behavior: 'smooth' as const }, 10, 100],
    ])('restores saved coordinates %j', async (position, left, top) => {
      restore({ default: position })
      await vi.waitFor(() => {
        expect(window.scrollX).toBe(left)
        expect(window.scrollY).toBe(top)
      })
    })

    it.each(['#text', '[data-scroll=true]', '#special~characters'])(
      'scrolls to %s',
      el => {
        restore({ default: { el } })
        expect(window.scrollX).toBe(0)
        expect(window.scrollY).toBe(0)
      }
    )

    it('applies offsets to the element position', () => {
      const element = document.getElementById('text')!
      const rect = vi
        .spyOn(element, 'getBoundingClientRect')
        .mockReturnValue(new DOMRect(100, 200, 10, 10))
      restore({ default: { el: '#text', left: 5, top: 15 } })
      expect(window.scrollX).toBe(95)
      expect(window.scrollY).toBe(185)
      rect.mockRestore()
    })

    it.each([
      ['#not-found', 'VUE_ROUTER_R0042'],
      ['.not-found', 'VUE_ROUTER_R0042'],
      ['#text .container', 'VUE_ROUTER_R0040'],
      ['[', 'VUE_ROUTER_R0041'],
      ['#invalid[', 'VUE_ROUTER_R0041'],
    ])('warns and keeps the scroll position for %s', (el, code) => {
      restore({ default: { el } })
      expect(code).toHaveBeenWarnedTimes(1)
      expect(el).toHaveBeenWarned()
      expect(window.scrollX).toBe(50)
      expect(window.scrollY).toBe(60)
    })
  })
})
