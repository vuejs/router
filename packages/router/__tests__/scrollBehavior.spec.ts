import { JSDOM } from 'jsdom'
import { scrollToPosition } from '../src/scrollBehavior'
import { createDom } from './utils'
import { mockWarn } from 'jest-mock-warn'

describe('scrollBehavior', () => {
  mockWarn()
  let dom: JSDOM
  let scrollTo: jest.SpyInstance
  let getElementById: jest.SpyInstance
  let querySelector: jest.SpyInstance

  beforeAll(() => {
    dom = createDom()
    scrollTo = jest.spyOn(window, 'scrollTo').mockImplementation(() => {})
    getElementById = jest.spyOn(document, 'getElementById')
    querySelector = jest.spyOn(document, 'querySelector')

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
    let child = document.createElement('div')
    child.classList.add('container')
    el.id = 'text'
    el.append(child)
    document.documentElement.appendChild(el)

    // .container #1
    el = document.createElement('div')
    child = document.createElement('div')
    el.classList.add('container')
    child.id = '1'
    el.append(child)
    document.documentElement.appendChild(el)
  })

  beforeEach(() => {
    scrollTo.mockClear()
    getElementById.mockClear()
    querySelector.mockClear()
    __DEV__ = false
  })

  afterAll(() => {
    __DEV__ = true
  })

  afterAll(() => {
    dom.window.close()
    scrollTo.mockRestore()
    getElementById.mockRestore()
    querySelector.mockRestore()
  })

  describe('left and top', () => {
    it('scrolls to a position', () => {
      scrollToPosition({ left: 10, top: 100 })
      expect(getElementById).not.toHaveBeenCalled()
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 10,
        top: 100,
        behavior: undefined,
      })
    })

    it('scrolls to a partial position top', () => {
      scrollToPosition({ top: 10 })
      expect(getElementById).not.toHaveBeenCalled()
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        top: 10,
        behavior: undefined,
      })
    })

    it('scrolls to a partial position left', () => {
      scrollToPosition({ left: 10 })
      expect(getElementById).not.toHaveBeenCalled()
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 10,
        behavior: undefined,
      })
    })
  })

  describe('el option', () => {
    it('scrolls to an id', () => {
      scrollToPosition({ el: '#text' })
      expect(getElementById).toHaveBeenCalledWith('text')
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: undefined,
      })
    })

    it('scrolls to an element using querySelector', () => {
      scrollToPosition({ el: '[data-scroll=true]' })
      expect(querySelector).toHaveBeenCalledWith('[data-scroll=true]')
      expect(getElementById).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: undefined,
      })
    })

    it('scrolls to an id with special characters', () => {
      scrollToPosition({ el: '#special~characters' })
      expect(getElementById).toHaveBeenCalledWith('special~characters')
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: undefined,
      })
    })

    it('scrolls to an id with special characters', () => {
      scrollToPosition({ el: '#special~characters' })
      expect(getElementById).toHaveBeenCalledWith('special~characters')
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: undefined,
      })
    })

    it('accepts a raw element', () => {
      scrollToPosition({ el: document.getElementById('special~characters')! })
      expect(getElementById).toHaveBeenCalledWith('special~characters')
      expect(querySelector).not.toHaveBeenCalled()
      expect(scrollTo).toHaveBeenCalledWith({
        left: 0,
        top: 0,
        behavior: undefined,
      })
    })

    describe('warnings', () => {
      beforeEach(() => {
        __DEV__ = true
      })

      it('warns if element cannot be found with id', () => {
        scrollToPosition({ el: '#not-found' })
        expect(
          `Couldn't find element using selector "#not-found"`
        ).toHaveBeenWarned()
      })

      it('warns if element cannot be found with selector', () => {
        scrollToPosition({ el: '.not-found' })
        expect(
          `Couldn't find element using selector ".not-found"`
        ).toHaveBeenWarned()
      })

      it('warns if element cannot be found with id but can with selector', () => {
        scrollToPosition({ el: '#text .container' })
        expect(
          `selector "#text .container" should be passed as "el: document.querySelector('#text .container')"`
        ).toHaveBeenWarned()
      })

      it('warns if element cannot be found with id but can with selector', () => {
        scrollToPosition({ el: '#text .container' })
        expect(
          `selector "#text .container" should be passed as "el: document.querySelector('#text .container')"`
        ).toHaveBeenWarned()
      })

      it('warns if querySelector throws', () => {
        scrollToPosition({ el: '.container #1' })
        expect(`selector ".container #1" is invalid`).toHaveBeenWarned()
      })
    })
  })
})
