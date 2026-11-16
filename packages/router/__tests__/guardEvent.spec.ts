/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from 'vitest'
import { _guardEvent } from '../src'

function anchor(target?: string) {
  const a = document.createElement('a')
  if (target != null) a.setAttribute('target', target)
  return a
}

/**
 * Dispatches a click on `el` and returns the result of `_guardEvent` from
 * within the listener (so `currentTarget` is set).
 */
function clickOn(
  el: Element,
  init: MouseEventInit = {},
  explicitEl?: Element,
  preventBefore = false
) {
  let result: boolean | undefined
  if (preventBefore) el.addEventListener('click', e => e.preventDefault())
  el.addEventListener('click', e => {
    result = _guardEvent(e as MouseEvent, explicitEl)
  })
  const e = new MouseEvent('click', { cancelable: true, button: 0, ...init })
  el.dispatchEvent(e)
  return { result, e }
}

describe('_guardEvent', () => {
  it('accepts a plain left click', () => {
    const { result } = clickOn(anchor())
    expect(result).toBe(true)
  })

  it('does not call preventDefault', () => {
    const { result, e } = clickOn(anchor())
    expect(result).toBe(true)
    expect(e.defaultPrevented).toBe(false)
  })

  it.each(['metaKey', 'altKey', 'ctrlKey', 'shiftKey'] as const)(
    'rejects clicks with %s',
    key => {
      expect(clickOn(anchor(), { [key]: true }).result).toBe(false)
    }
  )

  it.each([1, 2])('rejects clicks with button %d', button => {
    expect(clickOn(anchor(), { button }).result).toBe(false)
  })

  it('rejects already prevented events', () => {
    expect(clickOn(anchor(), {}, undefined, true).result).toBe(false)
  })

  it.each(['_blank', '_BLANK', 'foo _blank'])(
    'rejects target="%s" on currentTarget',
    target => {
      expect(clickOn(anchor(target)).result).toBe(false)
    }
  )

  it('accepts other targets', () => {
    expect(clickOn(anchor('_self')).result).toBe(true)
    expect(clickOn(anchor('my_blank_frame')).result).toBe(true)
  })

  it('checks the explicit element instead of currentTarget', () => {
    // event delegation: the listener is on a container, not on the link
    const container = document.createElement('div')
    const link = anchor('_blank')
    container.appendChild(link)
    expect(clickOn(container).result).toBe(true)
    expect(clickOn(container, {}, link).result).toBe(false)

    const blankContainer = document.createElement('div')
    blankContainer.setAttribute('target', '_blank')
    expect(clickOn(blankContainer, {}, anchor()).result).toBe(true)
  })

  it('works with events without DOM targets', () => {
    expect(_guardEvent({} as MouseEvent)).toBe(true)
    expect(_guardEvent({ button: 1 } as MouseEvent)).toBe(false)
  })
})
