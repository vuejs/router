import createMemoryHistory from '../../src/history/memory'
import {
  START,
  HistoryLocationNormalized,
  RawHistoryLocation,
} from '../../src/history/common'

const loc: RawHistoryLocation = '/foo'

const loc2: RawHistoryLocation = '/bar'

const normaliezedLoc: HistoryLocationNormalized = {
  fullPath: '/foo',
}

const normaliezedLoc2: HistoryLocationNormalized = {
  fullPath: '/bar',
}

describe('Memory history', () => {
  it('starts in nowhere', () => {
    const history = createMemoryHistory()
    expect(history.location).toEqual(START)
  })

  it('can push a location', () => {
    const history = createMemoryHistory()
    history.push('/somewhere?foo=foo#hey')
    expect(history.location).toEqual({
      fullPath: '/somewhere?foo=foo#hey',
    })
  })

  it('can replace a location', () => {
    const history = createMemoryHistory()
    // partial version
    history.replace('/somewhere?foo=foo#hey')
    expect(history.location).toEqual({
      fullPath: '/somewhere?foo=foo#hey',
    })
  })

  it('does not trigger listeners with push', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not trigger listeners with replace', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.replace(loc)
    expect(spy).not.toHaveBeenCalled()
  })

  it('can go back', () => {
    const history = createMemoryHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    expect(history.location).toEqual(normaliezedLoc)
    history.back()
    expect(history.location).toEqual(START)
  })

  it('does nothing with back if queue contains only one element', () => {
    const history = createMemoryHistory()
    history.back()
    expect(history.location).toEqual(START)
  })

  it('does nothing with forward if at end of log', () => {
    const history = createMemoryHistory()
    history.forward()
    expect(history.location).toEqual(START)
  })

  it('can moves back and forth in history queue', () => {
    const history = createMemoryHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    history.back()
    expect(history.location).toEqual(START)
    history.forward()
    expect(history.location).toEqual(normaliezedLoc)
    history.forward()
    expect(history.location).toEqual(normaliezedLoc2)
  })

  it('can push in the middle of the history', () => {
    const history = createMemoryHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    history.back()
    expect(history.location).toEqual(START)
    history.push(loc2)
    expect(history.location).toEqual(normaliezedLoc2)
    // does nothing
    history.forward()
    expect(history.location).toEqual(normaliezedLoc2)
  })

  it('can listen to navigations', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    history.back()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(START, normaliezedLoc, {
      direction: 'back',
      distance: -1,
      type: 'pop',
    })
    history.forward()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenLastCalledWith(normaliezedLoc, START, {
      direction: 'forward',
      distance: 1,
      type: 'pop',
    })
  })

  it('can stop listening to navigation', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    const spy2 = jest.fn()
    // remove right away
    history.listen(spy)()
    const remove = history.listen(spy2)
    history.push(loc)
    history.back()
    expect(spy).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(1)
    remove()
    history.forward()
    expect(spy).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('removing the same listener is a noop', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    const spy2 = jest.fn()
    const rem = history.listen(spy)
    const rem2 = history.listen(spy2)
    rem()
    rem()
    history.push(loc)
    history.back()
    expect(spy).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(1)
    rem2()
    rem2()
    history.forward()
    expect(spy).not.toHaveBeenCalled()
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('removes all listeners with destroy', () => {
    const history = createMemoryHistory()
    history.push('/other')
    const spy = jest.fn()
    history.listen(spy)
    history.destroy()
    history.back()
    expect(spy).not.toHaveBeenCalled()
  })

  it('can avoid listeners with back and forward', () => {
    const history = createMemoryHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    history.back(false)
    expect(spy).not.toHaveBeenCalled()
    history.forward(false)
    expect(spy).not.toHaveBeenCalled()
  })
})
