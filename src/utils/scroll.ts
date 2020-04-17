// import { RouteLocationNormalized } from '../types'

import { isBrowser } from './env'

export type ScrollToPosition = {
  x: number
  y: number
}

export interface ScrollToElement {
  selector: string
  offset?: ScrollToPosition
}

export type ScrollPosition = ScrollToPosition | ScrollToElement

export function computeScrollPosition(el?: Element): ScrollToPosition {
  return el
    ? {
        x: el.scrollLeft,
        y: el.scrollTop,
      }
    : {
        x: window.pageXOffset,
        y: window.pageYOffset,
      }
}

function getElementPosition(
  el: Element,
  offset: ScrollToPosition
): ScrollToPosition {
  const docEl = document.documentElement
  const docRect = docEl.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    x: elRect.left - docRect.left - offset.x,
    y: elRect.top - docRect.top - offset.y,
  }
}

const hashStartsWithNumberRE = /^#\d/

export function scrollToPosition(position: ScrollPosition): void {
  let normalizedPosition: ScrollToPosition | null = null

  if ('selector' in position) {
    // getElementById would still fail if the selector contains a more complicated query like #main[data-attr]
    // but at the same time, it doesn't make much sense to select an element with an id and an extra selector
    const el = hashStartsWithNumberRE.test(position.selector)
      ? document.getElementById(position.selector.slice(1))
      : document.querySelector(position.selector)

    if (el) {
      const offset: ScrollToPosition = position.offset || { x: 0, y: 0 }
      normalizedPosition = getElementPosition(el, offset)
    }
    // TODO: else dev warning?
  } else {
    normalizedPosition = {
      x: position.x,
      y: position.y,
    }
  }

  if (isBrowser && normalizedPosition) {
    window.scrollTo(normalizedPosition.x, normalizedPosition.y)
  }
}

/**
 * TODO: refactor the scroll behavior so it can be tree shaken
 */

export const scrollPositions = new Map<string, ScrollToPosition>()

export function getScrollKey(path: string, distance: number): string {
  const position: number =
    isBrowser && history.state ? history.state.position - distance : -1
  return position + path
}

export function saveScrollOnLeave(key: string) {
  scrollPositions.set(key, isBrowser ? computeScrollPosition() : { x: 0, y: 0 })
}

export function getSavedScroll(key: string) {
  return scrollPositions.get(key)
}
