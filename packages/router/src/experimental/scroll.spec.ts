/**
 * @vitest-environment happy-dom
 */
import { CAPTURE_LEGACY, RESTORE_LEGACY } from './scroll-restoration'
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

  describe('cature', () => {
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

    describe('CAPTURE_LEGACY', () => {
      it('captures the current scroll position when scrollRestoration is manual', () => {
        history.scrollRestoration = 'manual'
        expect(CAPTURE_LEGACY()).toEqual({ left: 10, top: 100 })
        expect(scrollXMock).toHaveBeenCalledTimes(1)
        expect(scrollYMock).toHaveBeenCalledTimes(1)
      })

      it('returns null when scrollRestoration is auto', () => {
        history.scrollRestoration = 'auto'
        expect(CAPTURE_LEGACY()).toBe(null)
        expect(scrollXMock).toHaveBeenCalledTimes(0)
        expect(scrollYMock).toHaveBeenCalledTimes(0)
      })
    })
  })

  describe('restore', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const getElementById = vi.spyOn(document, 'getElementById')
    const querySelector = vi.spyOn(document, 'querySelector')

    beforeAll(() => {
      // #text
      let el = document.createElement('div')
      el.id = 'text'
      document.documentElement.appendChild(el)

      // [data-scroll]
      el = document.createElement('div')
      el.setAttribute('data-scroll', 'true')
      document.documentElement.appendChild(el)

      // #special~characters
      el = document.createElement('div')
      el.id = 'special~characters'
      document.documentElement.appendChild(el)

      // #text .container
      el = document.createElement('div')
      const child = document.createElement('div')
      child.classList.add('container')
      el.id = 'text'
      el.append(child)
      document.documentElement.appendChild(el)
    })

    beforeEach(() => {
      scrollTo.mockClear()
      getElementById.mockClear()
      querySelector.mockClear()
    })

    afterAll(() => {
      scrollTo.mockRestore()
      getElementById.mockRestore()
      querySelector.mockRestore()
    })

    describe('RESTORE_LEGACY', () => {
      describe('left and top', () => {
        it('scrolls to a position', () => {
          RESTORE_LEGACY({ left: 10, top: 100 })
          expect(getElementById).toHaveBeenCalledTimes(0)
          expect(querySelector).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledTimes(1)
          expect(scrollTo).toHaveBeenCalledWith({
            left: 10,
            top: 100,
            behavior: undefined,
          })
        })

        it('scrolls to a partial position top', () => {
          RESTORE_LEGACY({ top: 10 })
          expect(getElementById).toHaveBeenCalledTimes(0)
          expect(querySelector).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledWith({
            top: 10,
            behavior: undefined,
          })
        })

        it('scrolls to a partial position left', () => {
          RESTORE_LEGACY({ left: 10 })
          expect(getElementById).toHaveBeenCalledTimes(0)
          expect(querySelector).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledWith({
            left: 10,
            behavior: undefined,
          })
        })

        it('forwards the behavior option', () => {
          RESTORE_LEGACY({ left: 10, top: 100, behavior: 'smooth' })
          expect(scrollTo).toHaveBeenCalledWith({
            left: 10,
            top: 100,
            behavior: 'smooth',
          })
        })
      })

      describe('el option', () => {
        it('scrolls to an id', () => {
          RESTORE_LEGACY({ el: '#text' })
          expect(getElementById).toHaveBeenCalledWith('text')
          expect(querySelector).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledWith({
            left: 0,
            top: 0,
            behavior: undefined,
          })
        })

        it('scrolls to an element using querySelector', () => {
          RESTORE_LEGACY({ el: '[data-scroll=true]' })
          expect(querySelector).toHaveBeenCalledWith('[data-scroll=true]')
          expect(getElementById).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledWith({
            left: 0,
            top: 0,
            behavior: undefined,
          })
        })

        it('scrolls to an id with special characters', () => {
          RESTORE_LEGACY({ el: '#special~characters' })
          expect(getElementById).toHaveBeenCalledWith('special~characters')
          expect(querySelector).toHaveBeenCalledTimes(0)
          expect(scrollTo).toHaveBeenCalledWith({
            left: 0,
            top: 0,
            behavior: undefined,
          })
        })

        it('applies the offset relative to the element', () => {
          RESTORE_LEGACY({ el: '#text', left: 5, top: 15 })
          expect(scrollTo).toHaveBeenCalledWith(
            expect.objectContaining({ behavior: undefined })
          )
        })

        describe('warnings', () => {
          it('warns if element cannot be found with id', () => {
            RESTORE_LEGACY({ el: '#not-found' })
            expect('VUE_ROUTER_R0042').toHaveBeenWarned()
            expect('#not-found').toHaveBeenWarned()
          })

          it('warns if element cannot be found with selector', () => {
            RESTORE_LEGACY({ el: '.not-found' })
            expect('VUE_ROUTER_R0042').toHaveBeenWarned()
            expect('.not-found').toHaveBeenWarned()
          })

          it('warns if element cannot be found with id but can with selector', () => {
            RESTORE_LEGACY({ el: '#text .container' })
            expect('VUE_ROUTER_R0040').toHaveBeenWarned()
            expect('#text .container').toHaveBeenWarned()
          })
        })
      })
    })
  })
})
