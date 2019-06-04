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
    expect(history.location).toEqual({
      fullPath: '/',
      path: '/',
      query: {},
      hash: '',
    })
  })

  it('can push a location', () => {
    const history = new AbstractHistory()
    // normalized version
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

  it('saves forward information', () => {})

  it('can replace a location', () => {})
  it('can simulate a navigation', () => {})

  it('add entries to the queue', () => {
    const history = new AbstractHistory()
    expect(history.queue).toHaveLength(0)
    history.push(loc)
    expect(history.queue).toHaveLength(1)
    expect(history.queue[0]).toEqual(normaliezedLoc)
    history.push(loc2)
    expect(history.queue).toHaveLength(2)
    expect(history.queue[1]).toEqual(normaliezedLoc2)
  })

  it('can go back', () => {
    const history = new AbstractHistory()
    history.push(loc)
    history.push(loc2)
    history.back()
    expect(history.queue).toHaveLength(1)
    expect(history.location).toEqual(normaliezedLoc)
    history.back()
    expect(history.queue).toHaveLength(0)
    expect(history.location).toEqual(START)
  })

  it('does nothing with back if queue is empty', () => {
    const history = new AbstractHistory()
    history.back()
    expect(history.location).toEqual(START)
  })
  it('does nothing with forward if at end of log', () => {})
})
