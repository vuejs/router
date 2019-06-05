// @ts-check

require('./helper')
const expect = require('expect')
const { AbstractHistory } = require('../src/history/abstract')
const { START } = require('../src/history/base')

/** @type {import('../src/history/base').HistoryLocation} */
const loc = {
  path: '/foo',
}
const loc2 = {
  path: '/bar',
}

const normaliezedLoc = {
  path: '/foo',
  query: {},
  hash: '',
  fullPath: '/foo',
}

const normaliezedLoc2 = {
  path: '/bar',
  query: {},
  hash: '',
  fullPath: '/bar',
}

describe('Abstract/in memory history', () => {
  it('starts at /', () => {
    const history = new AbstractHistory()
    expect(history.location).toEqual(START)
    expect(history.location).toEqual({
      fullPath: '/',
      path: '/',
      query: {},
      hash: '',
    })
    expect(history.queue).toHaveLength(1)
  })

  it('can push a location', () => {
    const history = new AbstractHistory()
    // partial version
    history.push({ path: '/somewhere', hash: '#hey', query: { foo: 'foo' } })
    expect(history.location).toEqual({
      fullPath: '/somewhere?foo=foo#hey',
      path: '/somewhere',
      query: { foo: 'foo' },
      hash: '#hey',
    })

    // partial version
    history.push({ path: '/path', hash: '#ho' })
    expect(history.location).toEqual({
      fullPath: '/path#ho',
      path: '/path',
      query: {},
      hash: '#ho',
    })
  })

  it('can replace a location', () => {
    const history = new AbstractHistory()
    // partial version
    history.replace({ path: '/somewhere', hash: '#hey', query: { foo: 'foo' } })
    expect(history.location).toEqual({
      fullPath: '/somewhere?foo=foo#hey',
      path: '/somewhere',
      query: { foo: 'foo' },
      hash: '#hey',
    })
    expect(history.position).toEqual(0)
    expect(history.queue).toHaveLength(1)
    history.push(loc)

    // partial version
    history.replace({ path: '/path', hash: '#ho' })
    expect(history.location).toEqual({
      fullPath: '/path#ho',
      path: '/path',
      query: {},
      hash: '#ho',
    })
    expect(history.position).toEqual(1)
    expect(history.queue).toHaveLength(2)
  })

  it('does not trigger listeners with push', () => {
    const history = new AbstractHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not trigger listeners with replace', () => {
    const history = new AbstractHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.replace(loc)
    expect(spy).not.toHaveBeenCalled()
  })

  it('add entries to the queue', () => {
    const history = new AbstractHistory()
    history.push(loc)
    expect(history.queue).toHaveLength(2)
    expect(history.queue[1]).toEqual(normaliezedLoc)
    history.push(loc2)
    expect(history.queue).toHaveLength(3)
    expect(history.queue[2]).toEqual(normaliezedLoc2)
  })

  it('can go back', () => {
    const history = new AbstractHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    expect(history.queue).toHaveLength(3)
    expect(history.location).toEqual(normaliezedLoc)
    history.back()
    expect(history.queue).toHaveLength(3)
    expect(history.location).toEqual(START)
  })

  it('does nothing with back if queue contains only one element', () => {
    const history = new AbstractHistory()
    history.back()
    expect(history.location).toEqual(START)
  })

  it('does nothing with forward if at end of log', () => {
    const history = new AbstractHistory()
    history.forward()
    expect(history.location).toEqual(START)
  })

  it('can moves back and forth in history queue', () => {
    const history = new AbstractHistory()
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
    const history = new AbstractHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    history.back()
    expect(history.location).toEqual(START)
    history.push(loc2)
    expect(history.queue).toHaveLength(2)
    expect(history.location).toEqual(normaliezedLoc2)
    // does nothing
    history.forward()
    expect(history.queue).toHaveLength(2)
    expect(history.location).toEqual(normaliezedLoc2)
  })

  it('can listen to navigations', () => {
    const history = new AbstractHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    history.back()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(START, normaliezedLoc, {
      direction: 'back',
    })
    history.forward()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy).toHaveBeenLastCalledWith(normaliezedLoc, START, {
      direction: 'forward',
    })
  })

  it('can stop listening to navigation', () => {
    const history = new AbstractHistory()
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
    const history = new AbstractHistory()
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
    const history = new AbstractHistory()
    const spy = jest.fn()
    history.listen(spy)
    // @ts-ignore
    expect(history.listeners).toHaveLength(1)
    history.destroy()
    // @ts-ignore
    expect(history.listeners).toHaveLength(0)
  })

  it('can avoid listeners with back and forward', () => {
    const history = new AbstractHistory()
    const spy = jest.fn()
    history.listen(spy)
    history.push(loc)
    history.back(false)
    expect(spy).not.toHaveBeenCalled()
    history.forward(false)
    expect(spy).not.toHaveBeenCalled()
  })
})
